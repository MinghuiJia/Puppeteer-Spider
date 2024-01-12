/*
 * @Author: jiaminghui
 * @Date: 2024-01-05 21:05:38
 * @LastEditTime: 2024-01-07 16:52:08
 * @LastEditors: jiaminghui
 * @FilePath: \spider\src\main.ts
 * @Description: 
 */
import { MyZhihuSpider } from "./ZhihuSpider";
import { MyQuoraSpider } from "./QuoraSpider";
import { connect } from "puppeteer";

(async () => {
  const browser = await connect({
    browserURL: `http://127.0.0.1:4444`,
  });

  const taskSpider = new MyZhihuSpider(browser);
  await taskSpider.asyncGatherTask();
  // const taskSpider = new MyQuoraSpider(browser);
  // await taskSpider.asyncGatherTask("china new energy");
  // const mongoAdaptor = new MongoDBAdaptor(config.getMongoDB());
  // await mongoAdaptor.connect();
  // await mongoAdaptor.insert({ key: 123, text: "123" });
  // await mongoAdaptor.find();
})();
