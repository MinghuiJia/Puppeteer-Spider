import { Spider } from "./spider";
import { Page } from "puppeteer";

export class MyQuoraSpider extends Spider {
  constructor(browser) {
    super(browser);
  }
  /**
   * @description 实现请求事件的处理逻辑
   * */
  setRequestEventListener(page: Page): Promise<never> {
    // 记住这里是观察者模式，有请求，这个方法就被执行
    page.on("request", async (res) => {
      await res.continue();
    });
    //@ts-ignore
    return;
  }

  /**
   * @description 实现响应事件的处理逻辑
   * */
  setResponseEventListener(page: Page): Promise<never> {
    // 记住这里是观察者模式，有响应，这个方法就被执行
    page.on("response", async (res) => {
      if (res.url().includes(`https://www.quora.com/graphql/gql_para_POST?q=SearchResultsListQuery`)) {
        console.log(res.url());
        const data = await res.json();
        const answers = data["data"]["searchConnection"]["edges"];
        const allNames = answers.map((item) => {
          const names = item["node"]["previewAnswer"]["author"]["names"][0];
          return names["givenName"] + " "  + names["familyName"];
        });
        console.log(allNames);
        const ele = await page.$$('div[aria-haspopup="dialog"]>a');
        for (const item of ele) {
          const text = await page.evaluate(element => element.textContent, item);
          if (allNames.includes(text)) {
            console.log(text);
            await item.hover();
            await this.clock(1);
          }
        }
      
        // await page.hover("a.puppeteer_test_link.qu-color--gray_dark.qu-cursor--pointer.qu-hover--textDecoration--underline");
      } else if (res.url().includes(`https://www.quora.com/graphql/gql_para_POST?q=UserInfocardLoaderQuery`)) {
        console.log(res.url());
        const data = await res.json();
        const authorInfos = data["data"]["user"];
        console.log(authorInfos["names"][0]["familyName"]+" "+authorInfos["names"][0]["givenName"]);
      }
    });
    //@ts-ignore
    return;
  }
  /**
   * @description 这个地方只负责拿数据，拿到的数据其他函数会自动存入数据库中
   * */
  public async asyncGatherTask(keyword): Promise<void> {
    try {
      const page = await this.browser.newPage();
      await this.addCommonListenerEvent(page);
      await this.setRequestEventListener(page);
      await this.setResponseEventListener(page);
      await page.goto("http://www.quora.com/search?q=" + keyword + '&type=answer');
      // eslint-disable-next-line no-constant-condition
      while (true) {
        await page.mouse.wheel({ deltaY: 500 });
        await this.clock(10);
      }

      // 爬完了数据关闭当前页面
      // await page.close();
    } catch (e) {
      console.log(e);
    }
  }
}
