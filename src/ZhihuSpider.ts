import { Spider } from "./spider";
import { Page } from "puppeteer";
import { insertOne, insertMany } from "./mongo/mongodb";

// declare const aaa:any;

export class MyZhihuSpider extends Spider {
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
      if (/https:\/\/www.zhihu.com\/api\/v4\/questions\/\d+\/feeds/.test(res.url())) {
        const { data } = await res.json();
        // 这里面存的是[],所以只能用insertMany,查看一下形式是什么,然后决定
        const withIdData = data.map((item) => {
          const id = item["target"]["id"];
          item["_id"] = id;

          // // 需要给根据id去访问一下，获取带有ip的发布时间
          // const timeWithIP = page.evaluate((id) => {
          //   window.open('https://www.zhihu.com/question/537806300'+'/answer/'+id, '_blank');
          //   // const timeWithIP = document.querySelector('.AnswerCard .RichContent div[class="ContentItem-time"]').textContent;
          //   window.close();
          //   return "";     
          // }, id);
          // item["target"]["time_with_ip"] = timeWithIP;
          return item;
        });

        const opRes = await insertMany(withIdData);
        if (opRes !== "ok") console.log(opRes);

      } else if (/https:\/\/www.zhihu.com\/api\/v4\/members/.test(res.url())) {
        const authorInfos = await res.json();
        if (!authorInfos["error"]) {
          console.log(authorInfos["name"]);
        }

      }
    });
    //@ts-ignore
    return;
  }
  private getFirstScreenData(): any {
    // // ts-ignore
    // aaa
    const firstAnswers = document.querySelectorAll(".List-item");
    const questionName = document.querySelector(".QuestionHeader-title").textContent;
    const firstAnswersData = Array.prototype.map.call(firstAnswers, (item) => {
      const authorName = item.querySelector('.AuthorInfo>meta[itemprop="name"]').getAttribute("content");
      const profileHref = item.querySelector('.AuthorInfo>meta[itemprop="url"]').getAttribute("content");
      const authorFollowers = item
        .querySelector('.AuthorInfo>meta[itemprop="zhihu:followerCount"]')
        .getAttribute("content");
      const authorDescribe = item.querySelector(".AuthorInfo-detail").textContent;

      const upvoteCount = item.querySelector('.ContentItem>meta[itemprop="upvoteCount"]').getAttribute("content");
      const dateCreateTime = item.querySelector('.ContentItem>meta[itemprop="dateCreated"]').getAttribute("content");
      const commentCount = item.querySelector('.ContentItem>meta[itemprop="commentCount"]').getAttribute("content");

      const content = item.querySelector(".RichContent-inner").textContent;

      const answeredTimeHref = item.querySelector(".ContentItem-time>a").getAttribute("href");
      const answeredTimeText = item.querySelector(".ContentItem-time>a>span").getAttribute("aria-label");

      const spiderObj = {
        _id: {
          question_name: questionName,
          author_name: authorName,
          answer_post_time_ip: answeredTimeText,
        },
        question_name: questionName,
        author_name: authorName,
        followerCount: authorFollowers,
        author_describle: authorDescribe,
        answer_upvotes: upvoteCount,
        answer_create_time: dateCreateTime.split("T")[0],
        answer_comment_count: commentCount,
        answer_content: content,
        answer_post_time_ip: answeredTimeText,
        keyword: "中国 碳中和",
      };
      return spiderObj;
    });
    return firstAnswersData;
  }
  /**
   * @description 这个地方只负责拿数据，拿到的数据其他函数会自动存入数据库中
   * */
  public async asyncGatherTask(): Promise<void> {
    try {
      const page = await this.browser.newPage();
      await this.addCommonListenerEvent(page);
      await this.setRequestEventListener(page);
      await this.setResponseEventListener(page);
      // "https://www.zhihu.com/question/422765767"
      await page.goto("https://www.zhihu.com/question/537806300", {
        // waitUntil是goto方法的一个选项，用于指定浏览器应该等待什么条件完成后再继续执行
        // 等待至少500毫秒，直到只有不超过2个网络连接为止。
        waitUntil: "networkidle2",
      });
      // evaluate里面的方法会注入到浏览器的console执行，reture得到的结果是promise，解析之后可以在项目中获得
      const res = await page.evaluate(this.getFirstScreenData);
      const opRes = await insertMany(res);
      if (opRes !== "ok") console.log(opRes);
      // eslint-disable-next-line no-constant-condition
      while (true) {
        await page.mouse.wheel({ deltaY: 800 });
        // await page.mouse.wheel({ deltaY: -10 });
        await this.clock(2);
        const flag = await page.evaluate(() => {
          const writeAnswerButton = document.querySelector('.QuestionAnswers-answerButton');
          if (!writeAnswerButton) {
            return false;
          }

          return true;
        })
        if (flag) break;
      }

      // 爬完了数据关闭当前页面
      await page.close();
    } catch (e) {
      console.log(e);
    }
  }
}
