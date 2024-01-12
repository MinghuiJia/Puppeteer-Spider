# puppeteer_spider
该项目是使用nodejs的puppeteer库实现对请求拦截，从而拦截返回的响应数据完成数据抓取的
- 爬虫技术栈
    - puppeteer - 爬虫技术框架
    - mongodb   - 数据库存储数据
    - docker    - 数据库部署容器
- docker
    - 除了最常规的操作流程：本机安装docker->docker拉取镜像->创建容器->部署mongodb
    - docker-compose.yml自动化部署的配置设置（点击右键，执行compose up select services自动创建）