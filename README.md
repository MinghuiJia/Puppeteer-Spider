# puppeteer_spider
该项目是使用nodejs的puppeteer库实现对请求拦截，从而拦截返回的响应数据完成数据抓取的
- 爬虫技术栈
    - puppeteer - 爬虫技术框架
    - mongodb   - 数据库存储数据
    - docker    - 数据库部署容器
- docker
    - 除了最常规的操作流程：本机安装docker->docker拉取镜像->创建容器->部署mongodb
    - docker-compose.yml自动化部署的配置设置（点击右键，执行compose up select services自动创建）
- 注意事项
    - puppeteer在npm install安装时可能会因为要安装chromuin而超时，解决办法就是使用npm先安装cnpm，然后通过cnpm install就可以成功
    - 在运行起来之后，可能会因为mongodb插入数据时报错，MongnServerSelectionError: this signal....，这是因为mongodb的版本与node版本不一致导致的问题，可能是node版本过低，提升node版本即可