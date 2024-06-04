/*
 * Copyright © 2020. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */


//@ts-check - Get type warnings from the TypeScript language server. Remove if not wanted.
/*
    api对象结构图参考:https://spotfiresoftware.github.io/spotfire-mods/overview 
    名字解释
    DataViewHierarchyNode
    在 Spotfire 这个数据分析软件中，DataView 是用来展示数据的核心组件，而 Hierarchy 则代表了数据的层次结构。那么，DataViewHierarchyNode 就是这个层次结构中的一个节点，代表着一部分数据或者数据的某种特定展示方式。
    举个例子来说，假设你正在分析一个公司的销售数据。这个数据可能包含了不同年份、不同季度、不同产品的销售额。在 Spotfire 中，你可以创建一个 DataView 来展示这些数据，并且按照年份、季度或产品来组织数据的层次结构。
    这时，每一个年份、每一个季度或每一个产品，都可以看作是一个 DataViewHierarchyNode。当你点击某个节点时，比如 2023 年这个节点，Spotfire 就会展示 2023 年的销售数据。如果你再进一步点击某个季度节点，比如 2023 年的第三季度，那么 Spotfire 就会展示 2023 年第三季度更详细的数据。
    所以，DataViewHierarchyNode 对象就像是大楼中的一层楼，帮助你组织和展示数据，让你能够更方便地分析和理解数据背后的故事

    DataViewHierarchyNode.rows(): Spotfire.DataViewRow[]
    返回与当前 DataViewHierarchyNode 对象及其所有子节点相关的 DataViewRow 对象数组
    假设你有一个按年份和产品类型组织的销售数据视图。在层次结构中，每个年份节点下可能都有几个产品类型节点，每个产品类型节点下又有具体的产品销售数据行。如果你选择了一个特定的年份节点并调用这个 rows() 方法，你将得到这个年份下所有产品类型和具体销售数据行的集合

    c.continuous(axis).value()
    获取当前行（`c`）在指定轴（`axis`）上的连续值

    c.categorical(axis).value()
    获取当前行（`c`）在指定轴（`axis`）上的分类值
    
    如何拿到文档属性?
    mod.document.properties()
    
    如何设置文档属性值?
    mod.document.propertie("name").set("value")

    是否能创建文档属性？
    不行，但能在mods初始化时，先检测有无这个文档属性，没有的话，提示他要他手动创建


    经过调研
    场景描述：
    1：如何拿到Mod中表数据
    假如选择的表是element表
    name	tableAlisname	tablename
    element1	就诊	就诊信息表
    element1	诊断	诊断信息表
    element1	预后	预后信息表
    element1	重点实验室检查	重点实验室检查表
    element1	其他实验室检查	其他实验室检查表
    element1	物理检查	物理检查表
    element1	治疗	治疗表
    element1	病史	病史表
    element1	人口学	人口学表
    element2	就诊2	就诊信息2表
    element2	诊断2	诊断信息2表
    在mod-manifest.json中配置了
    "dataViewDefinition": {
        "axes": [
            {
                "name": "Element",
                "mode": "categorical",
                "placement": "bottom"
            },
            {
                "name": "subElement",
                "mode": "categorical",
                "placement": "left"
            }
        ]
    },
    假设我选得Element轴对应字段name;subElement轴对应字段tableAlisname
    1）先通过Spotfire这个全局变量找到mod对象
    Spotfire.initialize(async (mod) =>{});
    2）再通过订阅mod.createReader订阅的render回调函数拿到DataView对象
    const reader = mod.createReader(
        mod.visualization.data()
    );
    reader.subscribe(render);
    //回调函数
    async function render(dataView) {

    }
    2）拿到X轴数据xLeaves
    let xHierarchy = await dataView.hierarchy("X");
    let xRoot = await xHierarchy.root();
    let xLeaves = xRoot.leaves();
    3）再遍历xLeaves对象拿到X轴和X轴对应的Y轴信息
    var columnName = "";
    var values = []
    let xValues = xLeaves.map(x => {
      //拿X轴此节点信息
      column = x.key
      //X轴此节点对应的行数据
      var rows = column.rows();
      rows.forEach(row => {
        //拿到Y轴此节点信息
        const value = row.categorical("Y").value()[0].key;
        values.push(value);
      });
      return {
        column: column,
        values: values
      };
    });

*/


/**
 * Get access to the Spotfire Mod API by providing a callback to the initialize method.
 * @param {Spotfire.Mod} mod - mod api
 */
var tableIdsV = [];
var YColumn = [];
Spotfire.initialize(async (mod) => {
    //初始化文档属性
    try {
      const myProperty = await mod.property("myProperty");
      let modsInteractiveparamsDocument = await mod.document.property("tableToCollapsibletablesDocumentProperties");
      modsInteractiveparamsDocument.set(myProperty.value().toString());
    } catch (error) {
      mod.controls.errorOverlay.show("请先创建文档属性tableToCollapsibletablesDocumentProperties");
    }
    /**
     * Create the read function.
     * 通过创建reader让我们能读取mod相关信息，比如窗体信息，自定义信息，视图信息等
     */
    const reader1 = mod.createReader(mod.visualization.data());
    const reader3 = mod.createReader(mod.windowSize());
    const reader2= mod.createReader(mod.document.property("tableToCollapsibletablesDocumentProperties"));
    /**
     * Store the context.
     * 获得mod的上下文，他提供了一些与mod交互的方法，例如显示错误信息，清除界面等，在本例中将使用他发送一个信号，表示mod准备好进行导出
     */
    const context = mod.getRenderContext();
    /**
     * Initiate the read loop
     * 定义数据视图reader的事件，当数据视图发生变化，就会触发render函数，render函数负责处理数据视图中数据并将其显示在模块中
     */
    reader1.subscribe(render1);
    reader2.subscribe(render2);
    reader3.subscribe(render3);
    /**
     * 监控windowsize变化，式容器自适应
     * @param {Spotfire.Size} windowSize
     */
    async function render3(windowSize) {
        //1：设置折叠栏高  
        $("#mdsea_main").height(windowSize.height-50);
    }
    /**
     * @param {Spotfire.DataView} dataView
     * mod的可视化视图，提供了与spotfire DataTable交互的查询结果
     * 表示Mod可视化的属性，在manifest中定义的属性
     * 这里三个属性都是在前面mod.createReader指定的
     */
    async function render1(dataView) {
        let modsInteractiveparamsDocument=null;
        let documentPropertieJSON=null;
        try {
          //由脚本操作等导致的dataView意外变化，只要是此情况都直接跳过，不处理
          modsInteractiveparamsDocument = await mod.document.property("tableToCollapsibletablesDocumentProperties");
          let value = modsInteractiveparamsDocument.value()
          documentPropertieJSON = value==""?{}:JSON.parse(value.toString());
          let useConfig = documentPropertieJSON.useConfig;
          let useLastConfig = documentPropertieJSON.useLastConfig;
          //判断如果是因为 保存配置 后给表添加了filter operate导致的dataview变化，就忽略它
          if($(".layui-colla-title").length>0){
            return
          }
          //这里必要时注释，避免初次打开无内容
          // if(useConfig.indexOf("hasdone")>=0||useLastConfig.indexOf("true")>=0||useConfig=="getLastConfig"){
          //   return
          // }
        } catch (error) {
          mod.controls.errorOverlay.show("请先创建文档属性：tableToCollapsibletablesDocumentProperties");
          return;
        }
        
        /**
         * Check the data view for errors
         * 处理报错信息
         */
        let errors = await dataView.getErrors();
        if (errors.length > 0) {
          // Showing an error overlay will hide the mod iframe.
          // Clear the mod content here to avoid flickering effect of
          // an old configuration when next valid data view is received.
          //mod.controls:mod的可视化空间和其他UI组件，例如上下文菜单，工具提示等
          //mod.controls.errorOverlay：显示错误覆盖原生spotfire风格
          mod.controls.errorOverlay.show(errors);
          return;
        }
        mod.controls.errorOverlay.hide();

        /**
         * 获得选配的axes所有值：X轴对应哪些字段、Y轴对应哪些字段
         */
        const axes = await dataView.axes();
        var XColumn = axes[0].hierarchy.levels;
        YColumn = axes[1].hierarchy.levels;
        /**
         * Get the hierarchy of the categorical X-axis.
         * 获得X轴的层次结构
         */
        //获得X轴的层次结构，在数据可视化中，X轴通常表示分类变量，Y轴表示数值变量，层次结构是一种数据结构，他将数据组织成树状结构，每个节点表示一个数据项，并包含该数据项的子数据项的信息
        const xHierarchy = await dataView.hierarchy("categories");
        //获取X轴的根节点，根节点没有父节点，因此它是所有节点的最顶层。如果X轴没有层次结构，或者X轴不是分类变量，则xHierarchy.root()方法将返回null
        const xRoot = await xHierarchy.root();
        if (xRoot == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }
        //X轴选两个column，意味着我的层级架构是root->第一个column->第二个column,然后第二个column才有对应的Y轴与之对应的categorical值
        //故此，这个xRoot我先遍历，先看第一层column
        let tablesSum = new Object();
        xRoot.children.forEach(root=>{
          //第一层column
          let subTable = new Object();
          const column1Name = root.key.split('.')[1];
          root.children.forEach(element => {
            //创建用于layui table的json对象集合[{},{}]
            let layuiDatas = [];
            //第二层column的名称
            const column2Name = element.key;
            //找到第二层column对应的Y轴值：categorical("Y")
            var rows = element.rows();
            let values = [];
            rows.forEach(row => {
              let layuiData = new Object();
              //Y轴对应的值：这里也就是字段分类名称，数据样例等
              //其他字段有多少，Y轴多选也就多少，不能少，不然这里报错
              for(let i=0;i<YColumn.length;i++){
                const value = row.categorical("columns").value()[i].key;
                values.push(value);
                layuiData[YColumn[i].name] = value;
              }
              layuiDatas.push(layuiData);
            })
            //到这里 layuiDatas数据收集结束
            subTable[column2Name] = layuiDatas;
          })
          //到这里subTable数据收集结束
          tablesSum[column1Name]=subTable
        })
        //至此talesSum数据收集结束，开始传递tablesSum数据渲染表操作了
        //根据YColumn生产用于layuiTable的col json对象
        let cols = [];
        cols.push({type: 'checkbox', fixed: 'left'});
        YColumn.forEach(element => {
          cols.push({field: element.name, title: element.name, width: 100});
        });
        //由于第一个用于排序的ID对用户没有意义这里给他影藏掉
        //cols.splice(1,1);这个方式不行，会导致后面的异常，再渲染后直接用css方式处理（在渲染表方法中执行）
        //最后一个长度不写
        cols[cols.length-1]["width"]=280;
        await renderTables(tablesSum,cols);
        //操作结束后要应用上一次的保存并应用的文档属性
        if(modsInteractiveparamsDocument !=null){
          documentPropertieJSON.useConfig = "getLastConfig";
          setTimeout(() => {
            modsInteractiveparamsDocument.set(JSON.stringify(documentPropertieJSON))  
          }, 1000);
        }
        /**
         * Signal that the mod is ready for export.
         * Mod准备好被导出了
         */
        context.signalRenderComplete();
        
    }
    /**
     * @param {String[]} rowIndices 
     * @returns 
     */
    async function markRow(rowIndices) {
      let dataView = await mod.visualization.data()
      // 检查 dataView 是否有效
      if (await dataView.hasExpired()) {
        console.error('DataView has expired.');
        return;
      }
      // 获取所有行
      const rows = await dataView.allRows();
      if(rowIndices==null) {
        //全选
        dataView.mark(rows);
        return
      }else{
        //全不选
        dataView.clearMarking();
      }
      // 过滤出需要标记的行
      const rowsToMark = rows.filter((row, index) => {
        const value = row.categorical("columns").value()[0].key;
        return rowIndices.includes(value)
      });

      // 执行标记操作
      dataView.mark(rowsToMark);
    }

    /**
     * 监控文档属性的变化
     * @param {Spotfire.AnalysisProperty} documentPropetie 
     */
    async function render2(documentPropetie){
      let tablelayui = layui.table;
      let value = documentPropetie.value();
      let documentPropertieJSON =value==""?{}:JSON.parse(value.toString());
      //处理点击Y轴事件
      let goToYName = documentPropertieJSON.goToYName;
      if(goToYName.indexOf("hasChanged")>=0){
        //触发变化了，需要执行跳转操作
        let idName = goToYName.split("-")[0];
        $('#mdsea_main').scrollTop($('#'+idName).offset().top - $('#mdsea_main').offset().top +$('#mdsea_main').scrollTop());
        $('#'+idName +' .layui-colla-content').addClass('layui-show');
        $('#'+idName +' .layui-colla-icon').html("");
        return;
      }
      //处理保存配置点击事件
      let saveStatue = documentPropertieJSON.saveStatue;
      if(saveStatue.indexOf("true")>=0){
        //处理保存配置操作
        //获得所有勾选的table复选框
        let tablesConfigJson = {};
        let tablesConfigExculdeJson = {};
        tableIdsV.forEach(tableId=>{
          let tableStatus =tablelayui.checkStatus(tableId);
          let tableName = tableId.split('jiping')[1];
          let categorical = tableId.split('jiping')[0];
          let subColumnJson = [];
          tableStatus.data.forEach(row=>{
            //由于 保存应用按钮作用由filter row换成 column
            const columnName1 = Object.keys(row)[0];
            const columnValue1 = row[columnName1];
            subColumnJson.push(columnValue1);
          })
          //赋值选中值
          tablesConfigJson[tableId]=subColumnJson;
          //找到对应的exculdeColumn
          let tablesExcludeColumn = $('[lay-id="'+tableId+'"] .layui-table-main tr').filter(function(){
            if(subColumnJson.indexOf($(this).find('[data-field="ID"]').text())<0){
              return true;
            }
          })
          let subColumnExculdeJson = [];
          tablesExcludeColumn.each(function(){
            let columnName1 = $(this).find('[data-field="'+YColumn[0].name+'"]').text();
            let columnName2 = $(this).find('[data-field="'+YColumn[1].name+'"]').text();
            let columnValue1 = columnName1+"."+columnName2+"\n"+tableName+"\n"+categorical;
            subColumnExculdeJson.push(columnValue1);
          })
          //赋值未选中值
          tablesConfigExculdeJson[tableId]=subColumnExculdeJson;
        });
        documentPropertieJSON.tablesConfigJson = tablesConfigJson;
        documentPropertieJSON.tablesConfigExculdeJson = tablesConfigExculdeJson;
        documentPropertieJSON.saveStatue = "saveDb";
        let json = JSON.stringify(documentPropertieJSON);
        setTimeout(() => {
          documentPropetie.set(json);
        }, 1000);
        return;
      }
      //监听全选还是全不选
      let selectAll = documentPropertieJSON.selectAll;
      if(selectAll.indexOf("hasChanged")>=0){
        let tableToNavDocumentProperties = await mod.document.property("tableToNavDocumentProperties");
        //触发变化了，需要执行跳转操作
        if(selectAll.indexOf("true")>=0){
          //执行全选
          let checkStatusJson = {};
          let tablesConfigJson = {};
          //全选所有table复选框
          tableIdsV.forEach(tableId=>{
            //将找到的index复选上
            tablelayui.setRowChecked(tableId, {
              index: 'all',
              checked:true
            });
            let json = doChecOutStatus(tableId,tablelayui);
            checkStatusJson = {...checkStatusJson,...json};
            //赋值tablesConfigJson值
            let tableStatus =tablelayui.checkStatus(tableId);
            let subColumnJson = [];
            tableStatus.data.forEach(row=>{
              const columnName1 = Object.keys(row)[0];
              const columnValue1 = row[columnName1];
              subColumnJson.push(columnValue1);
            })
            //赋值选中值
            tablesConfigJson[tableId]=subColumnJson;
          });
          documentPropertieJSON.tablesConfigJson=tablesConfigJson
          documentPropetie.set(JSON.stringify(documentPropertieJSON));
          let rowIndices = null;
          markRow(rowIndices).then(() => {
            console.log('Rows marked successfully.');
          }).catch((error) => {
            console.error('Error marking rows:', error);
          });
          //反馈给table_to_nav组件
          let tableToNavDocumentPropertiesValue = tableToNavDocumentProperties.value();
          let tableToNavDocumentPropertiesJSON = tableToNavDocumentPropertiesValue==""?{}:JSON.parse(tableToNavDocumentPropertiesValue.toString());
          tableToNavDocumentPropertiesJSON.checkStatus=true;
          tableToNavDocumentPropertiesJSON.checkStatusJson=checkStatusJson;
          tableToNavDocumentProperties.set(JSON.stringify(tableToNavDocumentPropertiesJSON));
        }else{
          //执行全不选
          //执行全选
          let checkStatusJson = {};
          let tablesConfigJson = {};
          //全选所有table复选框
          tableIdsV.forEach(tableId=>{
            //将找到的index复选上
            tablelayui.setRowChecked(tableId, {
              index: 'all',
              checked:false
            });
            let json = doChecOutStatus(tableId,tablelayui);
            checkStatusJson = {...checkStatusJson,...json};
            //赋值tablesConfigJson值
            let tableStatus =tablelayui.checkStatus(tableId);
            let subColumnJson = [];
            tableStatus.data.forEach(row=>{
              const columnName1 = Object.keys(row)[0];
              const columnValue1 = row[columnName1];
              subColumnJson.push(columnValue1);
            })
            //赋值选中值
            tablesConfigJson[tableId]=subColumnJson;
          });
          documentPropertieJSON.tablesConfigJson=tablesConfigJson
          documentPropetie.set(JSON.stringify(tablesConfigJson));
          let rowIndices=[];
          markRow(rowIndices).then(() => {
            console.log('Rows marked successfully.');
          }).catch((error) => {
            console.error('Error marking rows:', error);
          });
          //反馈给table_to_nav组件
          let tableToNavDocumentPropertiesValue = tableToNavDocumentProperties.value();
          let tableToNavDocumentPropertiesJSON = tableToNavDocumentPropertiesValue==""?{}:JSON.parse(tableToNavDocumentPropertiesValue.toString());
          tableToNavDocumentPropertiesJSON.checkStatus=true;
          tableToNavDocumentPropertiesJSON.checkStatusJson=checkStatusJson;
          tableToNavDocumentProperties.set(JSON.stringify(tableToNavDocumentPropertiesJSON));
        }
        //恢复原状
        documentPropertieJSON.selectAll="false";
        let json = JSON.stringify(documentPropertieJSON);
        documentPropetie.set(json);
        return
      }
      //处理保存应用点击事件
      let useConfig = documentPropertieJSON.useConfig;
      if(useConfig=="true"){
        //先执行保存事件，再执行应用触发
        //处理保存配置操作
        //获得所有勾选的table复选框
        let tablesConfigJson = {};
        let tablesConfigExculdeJson = {};
        tableIdsV.forEach(tableId=>{
          let tableStatus =tablelayui.checkStatus(tableId);
          let subColumnJson = [];
          let tableName = tableId.split('jiping')[1];
          let categorical = tableId.split('jiping')[0];
          tableStatus.data.forEach(row=>{
            const columnName1 = Object.keys(row)[0];
            const columnValue1 = row[columnName1];
            subColumnJson.push(columnValue1);
          })
          //赋值选中值
          tablesConfigJson[tableId]=subColumnJson;
          //找到对应的exculdeColumn
          let tablesExcludeColumn = $('[lay-id="'+tableId+'"] .layui-table-main tr').filter(function(){
            if(subColumnJson.indexOf($(this).find('[data-field="ID"]').text())<0){
              return true;
            }
          })
          let subColumnExculdeJson = [];
          tablesExcludeColumn.each(function(){
            let columnName1 = $(this).find('[data-field="'+YColumn[0].name+'"]').text();
            let columnName2 = $(this).find('[data-field="'+YColumn[1].name+'"]').text();
            let columnValue1 = columnName1+"."+columnName2+"\n"+tableName+"\n"+categorical;
            subColumnExculdeJson.push(columnValue1);
          })
          //赋值未选中值
          tablesConfigExculdeJson[tableId]=subColumnExculdeJson;
        });
        documentPropertieJSON.tablesConfigJson = tablesConfigJson;
        documentPropertieJSON.tablesConfigExculdeJson = tablesConfigExculdeJson;
        documentPropertieJSON.useConfig = "false";//恢复默认配置，saveanduse操作又触发文档属性变化变为点击button按钮触发
        let json = JSON.stringify(documentPropertieJSON);
        documentPropetie.set(json);
        //生效方式一：通过marking，两种方式看需求注释修改
        const rowIndices = Object.values(tablesConfigJson).flat();
        // 调用 markRow 函数来执行标记操作
        markRow(rowIndices).then(() => {
          console.log('Rows marked successfully.');
        }).catch((error) => {
          console.error('Error marking rows:', error);
        });
        //生效方式二：通过添加filterRow
        //主动给button所在的textArea环境中通过postMessage发送消息，触发点击事件
        setTimeout(()=>{
          // 在子iframe中  
          window.parent.postMessage({ message: 'table_to_collapsibletables_messages', data: 'saveanduse' }, '*');
        }, 1000);
        return;
      }
      //再次监控这个值：是否是删除filter row操作后的delete操作，如果是再执行一次saveanduse配置
      if(useConfig.indexOf("delete")>=0){
        setTimeout(() => {
          documentPropertieJSON.useConfig = "saveanduse";
          let json = JSON.stringify(documentPropertieJSON);
          documentPropetie.set(json);
        }, 5000);
      }
      //监控导航栏是否触发点击事情，导致显示内容做限制操作
      let showCateGoryStatue = documentPropertieJSON.showCategoryStatue;
      if(showCateGoryStatue){
        //拿到显示集合。并做show hide操作
        let showCategoryList = documentPropertieJSON.showCategoryList;
        if(showCategoryList.length>0){
          let showCategoryListString = showCategoryList.map(x=>"#"+x).join(",");
          $(".layui-colla-item").hide();
          $(showCategoryListString).show();
        }
        //复原
        documentPropertieJSON.showCategoryStatue=false;
        documentPropetie.set(JSON.stringify(documentPropertieJSON));
      }
      //处理折叠点击事件
      let fold = documentPropertieJSON.foldUnFold;
      if(fold.indexOf("hasChanged")>=0){
        let foldInner = fold.split("-")[0];
        if(foldInner=="true"){
          //折叠生效
          $('.layui-colla-content').addClass('layui-show');
          $(".layui-colla-icon").html("")
        }else{
          //展开
          $('.layui-colla-content').removeClass('layui-show');
          $(".layui-colla-icon").html("")
        }
        //复原
        documentPropertieJSON.foldUnFold = foldInner+"-noChange";
        setTimeout(() => {
          documentPropetie.set(JSON.stringify(documentPropertieJSON));
        }, 500);
        return;
      }
      //处理应用上次配置
      let uselastConfig = documentPropertieJSON.useLastConfig;
      //应用默认配置
      if(uselastConfig.indexOf("default")>=0){
        let checkStatusJson = {};
        //全选所有table复选框
        tableIdsV.forEach(tableId=>{
          //将找到的index复选上
          tablelayui.setRowChecked(tableId, {
            index: 'all',
            checked:true
          });
          let json = doChecOutStatus(tableId,tablelayui);
          checkStatusJson = {...checkStatusJson,...json};
        });
        //反馈给table_to_nav组件
        let tableToNavDocumentProperties = await mod.document.property("tableToNavDocumentProperties");
        let tableToNavDocumentPropertiesValue = tableToNavDocumentProperties.value();
        let tableToNavDocumentPropertiesJSON = tableToNavDocumentPropertiesValue==""?{}:JSON.parse(tableToNavDocumentPropertiesValue.toString());
        tableToNavDocumentPropertiesJSON.checkStatus=true;
        tableToNavDocumentPropertiesJSON.checkStatusJson=checkStatusJson;
        tableToNavDocumentProperties.set(JSON.stringify(tableToNavDocumentPropertiesJSON));
        //将配置恢复
        documentPropertieJSON.useLastConfig = "false";
        setTimeout(() => {
          documentPropetie.set(JSON.stringify(documentPropertieJSON))
        }, 500);
        return;
      }
      
      if(uselastConfig=="true"){
          //全部展开
          $('.layui-colla-content').addClass('layui-show');
          $(".layui-colla-icon").html("");
          //这种情况下使用文档属性中的配置
          let tablesConfigJson = documentPropertieJSON.tablesConfigJson;
          if(Object.keys(tablesConfigJson).length==0){
            layui.layer.msg('上次保存的配置信息为空，请重新选配并保存！');
            documentPropertieJSON.useLastConfig="false";
            documentPropetie.set(JSON.stringify(documentPropertieJSON))
            return;
          }
          let checkStatusJson = {};
          var tableIds = [];  
  
          // 选择所有具有id属性的table元素  
          $('table[id]').each(function() {  
              // 将每个table的id值添加到数组中  
              tableIds.push(this.id);  
          });  
          // 将上次保存配置信息应用到所有table中
          tableIds.forEach(tableId=>{
            let indexs = [];
            tablelayui.cache[tableId].forEach(function(row, index){
              if(tablesConfigJson[tableId].indexOf(row[YColumn[0].name])>=0)
              {
                indexs.push(index);
              }
            });
            //将找到的index复选上
            tablelayui.setRowChecked(tableId, {
              index: indexs,
              checked:true
            });
            let json = doChecOutStatus(tableId,tablelayui);
            checkStatusJson = {...checkStatusJson,...json};
          });
          //反馈给table_to_nav组件
          let tableToNavDocumentProperties = await mod.document.property("tableToNavDocumentProperties");
          let tableToNavDocumentPropertiesValue = tableToNavDocumentProperties.value();
          let tableToNavDocumentPropertiesJSON = tableToNavDocumentPropertiesValue==""?{}:JSON.parse(tableToNavDocumentPropertiesValue.toString());
          //发送通知给table_to_nav，适应折叠状态
          let time = new Date().getTime().toLocaleString();
          tableToNavDocumentPropertiesJSON.foldUnFold="true"+time;
          //汇总column选中值发送给table_to_nav
          tableToNavDocumentPropertiesJSON.checkStatus=true;
          tableToNavDocumentPropertiesJSON.checkStatusJson=checkStatusJson;
          tableToNavDocumentProperties.set(JSON.stringify(tableToNavDocumentPropertiesJSON));
          //将配置恢复
          documentPropertieJSON.useLastConfig = "false";
          //marking操作
          const rowIndices = Object.values(tablesConfigJson).flat();
          // 调用 markRow 函数来执行标记操作
          markRow(rowIndices).then(() => {
            console.log('Rows marked successfully.');
          }).catch((error) => {
            console.error('Error marking rows:', error);
          });
          setTimeout(() => {
            documentPropetie.set(JSON.stringify(documentPropertieJSON));  
          }, 500);
        }
      }
    /**
     * 将tables数据渲染到主栏目中，还会赋值全局变量tableIdsV
     * @param {Object} tables 所有字表的json字符串
     * @param {Object} cols
     */
    async function  renderTables(tables,cols){
      tableIdsV = [];
      let checkStatusJson = {};
      let modsInteractiveparamsDocument = await mod.document.property("tableToNavDocumentProperties");
      let tableToCollapsibletablesDocumentProperties = await mod.document.property("tableToCollapsibletablesDocumentProperties");
      layui.use('table',function(){
        let tablelayui = layui.table;
        //根据YColumn沪指
        $("#mdsea_main").empty();
        Object.keys(tables).forEach(keyId=>{
          //拿到表分类名
          //渲染分类栏目
          var table = tables[keyId];
          let columnSum  = Object.values(table).flatMap(inner=>Object.values(inner)).length
          let categoricalDiv = $('<div class="layui-colla-item layui-row" id="'+keyId+'"><div class="layui-colla-title">'+keyId+'（0/'+columnSum+'）</div></div>');
          checkStatusJson[keyId]=keyId+"（0/"+columnSum+"）"
          $("#mdsea_main").append(categoricalDiv);
          //开始绘制表内容了
          let tableNameDivString = '<div class="layui-colla-content">';
          Object.keys(table).forEach(keyId2=>{
            const tableId = keyId+"jiping"+keyId2;
            tableIdsV.push(tableId);
            let subColumnSum = tables[keyId][keyId2].length;
            //补充表内容divString
            tableNameDivString+='<div class="layui-col-xs4"><div><button type="button" class="layui-btn layui-btn-primary subTableTitle">'+keyId2+'（0/'+subColumnSum+'）</button><table class="layui-hide" id="'+tableId+'" lay-filter="'+tableId+'"></table></div></div>';
          })
          tableNameDivString+="</div>"
          //至此表格式绘制结束
          categoricalDiv.append($(tableNameDivString));
          //开始填充表内容
          for(let i=0;i<Object.keys(table).length;i++){
            const keyId2 = Object.keys(table)[i];
            let data = table[keyId2]
            const elem = "#"+keyId+"jiping"+keyId2;
            const tableId = "#"+keyId+"jiping"+keyId2;
            //开始渲染表数据
            //这里也渲染上选中的内容吧
            var inst = tablelayui.render({
              elem: elem,
              title:keyId2,
              cols: [cols],
              data: data,
              skin: 'grid'
            });
          }
          layui.element.render('collapse');
        });
        //css方式隐藏第一行数据
        $('[data-key$="0-1"]').hide();
        //到这里table数据渲染结束，开始收集column选中数据渲染到nav mods的Y轴数据
        let documentPropertieJSON =JSON.parse(modsInteractiveparamsDocument.value())
        documentPropertieJSON.checkStatus=true;
        documentPropertieJSON.checkStatusJson=checkStatusJson;
        modsInteractiveparamsDocument.set(JSON.stringify(documentPropertieJSON));
        //给每个table添加checkOut点击监听事件
        tableIdsV.forEach(tableId=>{
          tablelayui.on('checkbox('+tableId+')', async function(){
            modsInteractiveparamsDocument = await mod.document.property("tableToNavDocumentProperties");
            let documentPropertieJSON =JSON.parse(modsInteractiveparamsDocument.value())
            let tableToCollapsibletablesDocument = await mod.document.property("tableToCollapsibletablesDocumentProperties");
            let tableToCollapsibletablesJSON =JSON.parse(tableToCollapsibletablesDocument.value())
            let checkStatusJson =  doChecOutStatus(tableId,tablelayui);
            documentPropertieJSON.checkStatus=true;
            checkStatusJson = {...documentPropertieJSON.checkStatusJson,...checkStatusJson};
            documentPropertieJSON.checkStatusJson=checkStatusJson;
            modsInteractiveparamsDocument.set(JSON.stringify(documentPropertieJSON));
            //汇总待marking的数据
            let tablesConfigJson={};
            let tableStatus =tablelayui.checkStatus(tableId);
            let subColumnJson = [];
            tableStatus.data.forEach(row=>{
              const columnName1 = Object.keys(row)[0];
              const columnValue1 = row[columnName1];
              subColumnJson.push(columnValue1);
            })
            //赋值选中值
            tablesConfigJson[tableId]=subColumnJson;
            tablesConfigJson = {...tableToCollapsibletablesJSON.tablesConfigJson,...tablesConfigJson};
            tableToCollapsibletablesJSON.tablesConfigJson=tablesConfigJson
            tableToCollapsibletablesDocument.set(JSON.stringify(tableToCollapsibletablesJSON))
            const rowIndices = Object.values(tablesConfigJson).flat();
            // 调用 markRow 函数来执行标记操作
            markRow(rowIndices).then(() => {
              console.log('Rows marked successfully.');
            }).catch((error) => {
              console.error('Error marking rows:', error);
            });
          });
        });
      });
    }
    /**
     * 根据tableId来获得当前状态下的 checkout数据
     * @param {String} tableId
     * @param {Object} tablelayui 
     */
    function doChecOutStatus(tableId,tablelayui){
      let checkStatusJson = {};
      //添加checkout监听事件
      let tableStatus = tablelayui.checkStatus(tableId);
      let rowSum = tableStatus.data.length;
      let subColumnSum = $("#"+tableId).prev().text();
      subColumnSum = subColumnSum.replace(/(\d+)/, rowSum);
      $("#"+tableId).prev().text(subColumnSum);
      //指定分类栏目
      let key1 = tableId.split("jiping")[0]
      let columnSum = 0;
      $('#'+key1+' .subTableTitle').each((index, element) =>{
        subColumnSum = $(element).text().match(/\d+/)[0];
        columnSum=columnSum+parseInt(subColumnSum);
      });
      let columnSumHtml = $("#"+key1+" .layui-colla-title").html();
      columnSumHtml = columnSumHtml.replace(/(\d+)/, columnSum.toString());
      $("#"+key1+" .layui-colla-title").html(columnSumHtml);
      //汇总分类节点，表节点选中数
      checkStatusJson[key1]=columnSumHtml.replace(/<i\b[^>]*>(.*?)<\/i>/gi,'')
      return checkStatusJson;
    }
    //处理其他js程序
    layui.use(['element'],function(){
      // 自定义:textEquals选择器
      $.expr[':'].textEquals = function(element, index, meta, stack) {
        return $(element).text() === meta[3];
      };
      //监听回车事件
      $(".searchAfter").on('keypress',function(event){
        if(event.which != 13) {
          return;
        }
        $(".searchResult").hide();
        let searchColumnName = $(this).val().toString().trim();
        if(searchColumnName==""){
          return;
        }
        let cells = $('td[data-field="字段名称"]').filter(function(){
          return $(this).text().indexOf(searchColumnName)>=0;
        })
        if(cells.length > 0){
          $(".searchResult").show();
          $(".searchResult ul").empty();
          cells.slice(0,10).each(function(){
            let columnName = $(this).text();
            let tableId = $(this).parent().parent().parent().parent().parent().parent().attr("lay-id");
            let tableCatatory = tableId.split("jiping")[0]
            let tableName =  tableId.split("jiping")[1]
            //let columnNamenew = columnName+"("+tableName+"_"+tableCatatory+")";
            let columnNamenew = $('<span class="searchResult_columnName">'+columnName+'  </span><span class="searchResult_tableCatatorytableName">('+tableCatatory+'_'+tableName+')</span>');
            let newLiElement = $('<li>').append(columnNamenew).attr('tableId',tableCatatory).attr('columnName',columnName);
            //let newLiElement = $('<li>').text(columnNamenew).attr('tableId',tableCatatory).attr('columnName',columnName);
            $(".searchResult ul").append(newLiElement).append($("<br>"))
          });
        }
      });
      //监听查询结果点击事件
      $(".searchResult").on("click","li",function(){
        let text = $(this).text();
        let columnName = $(this).attr("columnName");
        $(".searchAfter").val(columnName);
        $(".searchResult").hide();
        //滚动位置tableid
        let tableId = $(this).attr("tableId");
        $('#mdsea_main').scrollTop($('#'+tableId).offset().top - $('#mdsea_main').offset().top +$('#mdsea_main').scrollTop());
        $('#'+tableId +' .layui-colla-content').addClass('layui-show');
        $('#'+tableId +' .layui-colla-icon').html("");
        //高亮一下column
        let columnCells = $('td div:textEquals("'+columnName+'")');
        columnCells.addClass('highlight-animation highlight');
        setTimeout(function() {
            columnCells.removeClass('highlight-animation highlight');
        }, 3000); // 500毫秒后恢复原状
      });
    });
});