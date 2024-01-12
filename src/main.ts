import { MyZhihuSpider } from "./ZhihuSpider";
import { MyQuoraSpider } from "./QuoraSpider";
import { connect } from "puppeteer";

(async () => {
  // 通过connect连接到Chromium实例，创建一个浏览器实例返回
  const browser = await connect({
    browserURL: `http://127.0.0.1:4444`,
  });

  // 创建爬虫的对象
  const taskSpider = new MyZhihuSpider(browser);

  const urls = [
    "https://www.zhihu.com/question/422765767",
    "https://www.zhihu.com/question/537806300",
  ]

  for (const url of urls) {
    // 执行爬虫任务
    console.log("processing " + url + " ...");
    await taskSpider.asyncGatherTask(url, "中国 碳中和");
  }
  // forEach不会等待每个迭代中的异步操作完成，而是会立即执行下一个迭代
  // forEach源码中，有一个while循环一直在调用callback回调函数，我们只是在将foreach中的callback使用了async/await来等待异步返回操作，而本身这个foreach并没有使用async/await来等待异步返回
  // 解决方案：使用for...of循环
  // urls.forEach(async (url) => {
    
  // });
  
  // const taskSpider = new MyQuoraSpider(browser);
  // await taskSpider.asyncGatherTask("china new energy");
  // const mongoAdaptor = new MongoDBAdaptor(config.getMongoDB());
  // await mongoAdaptor.connect();
  // await mongoAdaptor.insert({ key: 123, text: "123" });
  // await mongoAdaptor.find();
})();
