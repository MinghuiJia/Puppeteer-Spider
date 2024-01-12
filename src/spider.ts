import { Browser, Page } from "puppeteer";
/**
 * @description 事件监听接口
 * 只有涉及到接口方法时命名规范以 I 开头
 * 其他数据类型接口命名规范与 class 保持一致
 * */

interface IHTTPEventListener {
  // 请求时，做什么处理
  setRequestEventListener(page: Page): Promise<never>;

  // 响应时，做什么处理
  setResponseEventListener(page: Page): Promise<never>;
}

/**
 * @description 对 HTTP 协议的数据处理
 * */
interface IHTTPHandler {
  handleHeaders(data: never): void;

  handlePreview(data: string): void;
}

/**
 * @description 爬虫基本类
 * */
class Spider implements IHTTPEventListener, IHTTPHandler {
  protected browser: Browser;
  protected readonly blockList: Array<string> = [];

  // 传一个浏览器来实例化爬虫
  constructor(browser: Browser) {
    this.browser = browser;
  }

  /**
   * @description 处理 HTTP 响应数据
   * */
  handlePreview(data: string): void {
    throw new Error("handlePreview 方法没有实现！");
  }

  /**
   * @description 处理 HTTP 头部数据
   * */
  handleHeaders(data: never): void {
    throw new Error("handleHeaders 方法没有实现！");
  }

  /**
   * @description 为 HTTP 请求添加事件监听
   * */
  setRequestEventListener(page: Page): Promise<never> {
    throw new Error("setRequestEventListener 方法没有实现！");
  }

  /**
   * @description 为 HTTP 响应添加事件监听
   * */
  setResponseEventListener(page: Page): Promise<never> {
    throw new Error("setResponseEventListener 该方法没有实现！");
  }

  /**
   * @description 延时器，控制爬取数据的频率节奏
   */
  public async clock(s): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, s * 1000);
    });
  }

  /**
   * @description 为页面添加基本事件监听
   * */
  protected async addCommonListenerEvent(page: Page): Promise<void> {
    // 设置页面超时时间
    const timeout = 500;
    page.setDefaultTimeout(timeout * 1000);

    // 设置页面窗口大小
    const viewport = { width: 1920, height: 1080 };
    // 奇怪的 Bug ，设置的 viewport 不合适时，取不到页面大小参数
    await page.setViewport(viewport);

    const client = await page.target().createCDPSession();
    // 必须开启 "Network.enable"，否则无法拦截 service worker 请求
    await client.send("Network.enable");
    // 带齿轮（service worker）的请求页面需要开启
    await client.send("Network.setBypassServiceWorker", { bypass: true });
    // 对所有请求进行拦截
    await page.setRequestInterception(true);
    return;
  }

  // /**
  //  * @description 判断爬虫的生命状态，当前时间与上次状态更新的时间小于阈值就是存活状态
  //  * @return {boolean} 爬虫是否存活
  //  */
  // public isAlive(): boolean {
  //   // js 时间戳是 ms
  //   const timeout = new Date().getTime() - this.recentTime >= this.time.liveThreshold * 1000;
  //   if (timeout) {
  //     console.log(`超过 ${this.time.liveThreshold} 秒未收到响应，结束爬取`);
  //   }
  //   return !timeout && !this.isFinish;
  // }
}

export { Spider };
