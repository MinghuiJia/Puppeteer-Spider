import { MongoClient } from "mongodb";

// 设置mongodb相关的配置信息
const username = 'root'; // 用户名
const password = '123456'; // 密码
const url = `mongodb://${username}:${password}@localhost:27017`;

// 创建mongodb客户端对象
const client = new MongoClient(url);
// 设置数据库的名称和集合名称，插入过程中如果不存在会自动创建
const dbName = "test";
const collectionName = "book";

/**
 * @description 添加数据到数据库
 * @param { Array } data
 * @returns string
 */
const insertMany = async (data) => {
  try {
    // Use connect method to connect to the server
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertMany(data);
    client.close();

    return "ok";
  } catch (error) {
    return error;
  }
  
};
/**
 * @description 添加数据到数据库
 * @param { object } data
 * @returns string
 */
 const insertOne = async (data) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne(data);
    client.close();

    return "ok";
  } catch (error) {
    return error;
  }
};
/**
 * @description 清空数据库
 */
const deleteMany = async () => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.deleteMany();
    client.close();

    return "ok";
  } catch (error) {
    return error;
  }
};
/**
 * @description 获取数据集
 * @returns array
 */
const getData = async () => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const array = await collection.find().toArray();
    client.close();

    return array;
  } catch (error) {
    return error;
  }
};

export {
  insertMany,
  insertOne,
  getData,
  deleteMany,
}
