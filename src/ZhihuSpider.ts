import { Spider } from "./spider";
import { Page } from "puppeteer";
import { client, insertOne, insertMany_answers, insertMany_comments } from "./mongo/mongodb";

export class MyZhihuSpider extends Spider {
  protected keyword: string;
  protected url: string;

  constructor(browser) {
    super(browser);
  }

  /**
   * @description 初始化对象的变量
   * @param url 解析页面的url
   * @param keyword 获取页面url所用到的关键词
   */
  private init(url:string, keyword: string): void {
    this.url = url;
    this.keyword = keyword;
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
      // res.url()会返回响应对应的API
      // 通过正则匹配获取相关API返回的数据
      if (/https:\/\/www.zhihu.com\/api\/v4\/questions\/\d+\/feeds/.test(res.url())) {
        // 获取响应返回的json数据
        const { data } = await res.json();

        // 对返回的数据数组逐个处理
        const withIdData = data.map((item) => {
          // 设置数据主键
          const id = item["target"]["id"];
          item["_id"] = id;

          // 数据添加关键词
          item["keyword"] = this.keyword;

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

        // 数据存入数据库
        if (Object.keys(withIdData).length !== 0) {
          const opRes = await insertMany_answers(withIdData);
          await client.close();

          // 插入失败输出错误原因
          if (opRes !== "ok") console.log(opRes);
        }
        

      } else if (/https:\/\/www.zhihu.com\/api\/v4\/comment_v5\/answers\/\d+\/root_comment/.test(res.url())) {
        const regex = /https:\/\/www.zhihu.com\/api\/v4\/comment_v5\/answers\/(\d+)\/root_comment/;
        const result = res.url().match(regex);
        // 第一个元素(result[0])是完整匹配的字符串
        console.log(result[1]);  // "123456"，匹配的id就是对应回答的帖子
        
        const { data } = await res.json();
        // 这是一个数组
        const withIdData = data.map((item) => {
          // 设置主键
          const id = item["id"];
          item["_id"] = {
            answer_id: parseInt(result[1]),
            comment_id: id,
          };
          return item;
        });
        
        if (Object.keys(withIdData).length !== 0) {
          // 将评论数据插入数据库
          const opRes = await insertMany_comments(withIdData);
          await client.close();

          // 插入失败输出错误原因
          if (opRes !== "ok") console.log(opRes);
        }
      } 
      // else if (/https:\/\/www.zhihu.com\/api\/v4\/members/.test(res.url())) {
      //   // 获取作者相关信息
      //   const authorInfos = await res.json();
      //   // 作者可能账号会注销，所以需要判断有没有error字段
      //   if (!authorInfos["error"]) {
      //     console.log(authorInfos["name"]);
      //   }
        
      // }
    });
    //@ts-ignore
    return;
  }

  /**
   * @description 页面首屏解析
   * @returns 解析后组织好的数据对象
   */
  private getFirstScreenData(keyword: string): any {
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
        keyword: keyword,
      };
      return spiderObj;
    });
    return firstAnswersData;
  }

  /**
   * @description 当前页面将有评论的部分点开
   * @returns 解析后点击评论，展示评论内容，出发请求监听
   */
  private getFirstCommentButton(): any {
    // this.clock(2);
    // 把当前页面的评论点击一遍
    const allClickEles = document.querySelectorAll(".ContentItem .RichContent .ContentItem-actions");
    const allDivsEles = document.querySelectorAll(".List-item");
    for (let i = 0; i < allDivsEles.length; i++) {
      const each = allClickEles[i];
      const div = allDivsEles[i];
      const buttons = each && each.querySelectorAll("button");
      const commentButton = buttons && buttons[2];
      if (commentButton && /\d/.test(commentButton.textContent)) {
        div.scrollIntoView(false);
        // this.clock(1);

        commentButton.click();
        
        return true;
      }
    }

    return false;
  }

  /**
   * @description 这个地方只负责拿数据，拿到的数据其他函数会自动存入数据库中
   * */
  public async asyncGatherTask(url: string, keyword: string): Promise<void> {
    try {
      // 创建浏览器实例中的一个标签页-tab
      const page = await this.browser.newPage();

      // 将解析的url和keyword添加到对象的属性中
      this.init(url, keyword);

      // 为页面添加基本事件监听（最主要的是开启对请求的API的拦截）
      await this.addCommonListenerEvent(page);

      // 对请求事件进行监听处理（可以对请求时携带的参数进行处理，优化请求效率）
      await this.setRequestEventListener(page);

      // 对响应事件进行监听处理（获取响应时的数据）
      await this.setResponseEventListener(page);

      // 通过goto创建Page
      await page.goto(url, {
        // waitUntil是goto方法的一个选项，用于指定浏览器应该等待什么条件完成后再继续执行
        // 等待至少500毫秒，直到只有不超过2个网络连接为止，从而优化爬虫速度
        waitUntil: "networkidle2",
      });

      // 通过evaluate来首先对初始化时的页面进行解析（因为页面使用SSR渲染，一开始渲染的data通过API拦截抓取不到）
      // evaluate里面的方法会注入到浏览器的console执行，reture得到的结果是promise，解析之后可以在项目中获得
      // evaluate注入到浏览器console中，如果代码中没有对应变量：1. ts-ignore方法 2. 顶部声明 declare const aaa:string;
      const res = await page.evaluate(this.getFirstScreenData, keyword);

      // 首屏加载解析后的数据存储到数据库
      if (Object.keys(res).length !== 0) {
        const opRes = await insertMany_answers(res);
        await client.close();

        // 如果数据插入失败，输出错误的原因
        if (opRes !== "ok") console.log(opRes);
      }
      

      // 模拟浏览操作，循环滚动滚动条，触发API请求渲染页面的数据
      // eslint-disable-next-line no-constant-condition
      let scrollCount = 0;
      while (true) {
        // 收集评论信息
        // 当前这里由于没有点击查看全部xxx条回复，所以内容不全，后续有时间应该补充一下
        while(true) {
          await this.clock(2);

          const res = await page.evaluate(this.getFirstCommentButton);

          if (!res) {
            // 结束了，当前没有可以点击的评论了，可能会导致页面在最底部，无法刷新
            await page.mouse.wheel({ deltaY: -100 });
            break;
          }

          // 这里需要完善一下，假设点击评论后弹出的是评论框，那么就需要查找弹出框的取消按钮
          // 如果存在某个id下元素存在，那么说明弹出了评论框
          // 这个时候需要点击一下ESC，或者不用判断每次都直接点击Esc防止弹出
          await page.keyboard.press('Escape');
          await page.mouse.wheel({ deltaY: 200 });
        }

        await page.mouse.wheel({ deltaY: 800 });
        await this.clock(2);

        // 没滚动100次，就向上滚动一次，防止随着数量越来越多，由于移动的距离变大，导致后面加载不出新的数据
        scrollCount += 1;
        if (scrollCount > 100) {
          scrollCount = 0;
          await page.mouse.wheel({ deltaY: -50 });
          await this.clock(2);
        }

        // 解析页面中出现指定元素来终止滚动
        const flag = await page.evaluate(() => {
          const writeAnswerButton = document.querySelector('.QuestionAnswers-answerButton');
          if (!writeAnswerButton) {
            return false;
          }

          return true;
        })
        if (flag) break;
      }

      // // 收集评论信息
      // while(true) {
      //   await this.clock(2);

      //   const res = await page.evaluate(this.getFirstCommentButton);

      //   // const eles = this.getFirstCommentButton();
      //   if (!res) {
      //     break;
      //   }
      // }

      console.log("当前页:"+url+"爬取完毕");
      // 爬完了数据关闭当前页面
      await page.close();
    } catch (e) {
      console.log(e);
    }
  }
}
