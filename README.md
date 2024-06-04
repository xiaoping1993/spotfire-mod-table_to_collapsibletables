# Mod Starter Project
This is a mod template project. It contains the minimum amount of code necessary to run a working mod.  

All source code for the mod example can be found in the `src` folder.

## Prerequisites
These instructions assume that you have [Node.js](https://nodejs.org/en/) (which includes npm) installed.

## How to get started (with development server)
- Open a terminal at the location of this example.
- Run `npm install`. This will install necessary tools. Run this command only the first time you are building the mod and skip this step for any subsequent builds.
- Run `npm run server`. This will start a development server.
- Start editing, for example `src/main.js`.
- In Spotfire, follow the steps of creating a new mod and connecting to the development server.

## Working without a development server
- In Spotfire, follow the steps of creating a new mod and then browse for, and point to, the _manifest_ in the `src` folder.

## 功能描述
将大表转为多个小表，按照配置指定的categories，columns
例如下图1，特征是按照“数据领域”、“数据表”分类（将这两个字段分配给categories）,字表显示字段:ID，字段名称，数据样例，计算逻辑（将这四个字段分配给columns）
就实现了将一个大表按照指定分类规则，指定显示子表字段展开显示了如图
![图1](image.png)![图2](image-1.png)

通常与项目 spotfire-mod-table_to_nav结合起来用，这样导航栏就能与字表联动了，效果如图3
![图3](image-2.png)