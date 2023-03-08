# selectdb-cloud-doc
Document for SelectDB Cloud

## 文档编写规范

- 目录和文件名必须为英文，不能包含中文和空格。
- 所有文件名要带语言后缀。中文后缀为 zh-CN，如：Index.zh-CN.md。英文后缀为 en-US，如：_meta.en-US.json。
- 文档和文件夹在侧边栏的显示顺序和标题通过_meta.json文件定义。写法如下：
```
{
    "Overview": "SelectDB Cloud 介绍",
    "Getting-Started": "快速开始",
    "Management-Guide": "管理指南",
    "User-Guide": "使用指南",
    "SQL-Manual": "SQL手册"
}
```
key是文件名，value是标题，key会作为文档的路径，value显示在侧边栏。文档在侧边栏的显示顺序和 json 文件中定义的顺序一致。  


> 如果文件未在_meta.json中列出，会被附加到侧边栏的末尾并按字母顺序排序，文件名显示为标题。

