## 使用原因

1. 服务端没有造数据
2. 服务端数据不理想
3. 测试一些边界值
4. 复现Bug,快速定位问题

> 这是一个可以修改Ajax请求返回结果的Chrome插件，可用于调试/排查页面上的问题。（当然你也可以用其它一些工具如Charles修改网络请求的返回值，但操作繁琐，该插件方便很多，且不会对Chrome之外造成影响） 
  

## 安装


## 使用示例

## 注意
1. 建议第一次安装完重启浏览器，或者刷新你需要使用的页面。
2. 当你不需要使用该插件时，建议把开关关上（插件icon变为灰色），以免对页面正常浏览造成影响。
3. 该插件只会在JS层面上对返回结果进行修改，即只会修改全局的XMLHTTPRequest对象和fetch方法里的返回值，进而影响页面展现。而你在chrome的devtools的network里看到的请求返回结果不会有任何变化。


## 参考

- [YGYOOO/ajax-interceptor: A chrome extension to modify the response of ajax requests. 修改ajax请求返回结果的chrome插件](https://github.com/YGYOOO/ajax-interceptor)