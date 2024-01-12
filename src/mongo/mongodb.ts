/*
 * @Author: jiaminghui
 * @Date: 2024-01-07 16:23:03
 * @LastEditTime: 2024-01-07 22:35:27
 * @LastEditors: jiaminghui
 * @FilePath: \spider\src\mongo\mongodb.ts
 * @Description: 
 */
import { MongoClient } from "mongodb";
// const { MongoClient } = require("mongodb");
// Connection URL
const username = 'root'; // 用户名
const password = '123456'; // 密码
const url = `mongodb://${username}:${password}@localhost:27017`;
const client = new MongoClient(url);
// Database Name
const dbName = "test";
const collectionName = "book";
/**
 *添加数据到数据库
 * @param { Array} data
 * @returns string
 */
const insertMany = async (data) => {
  // Use connect method to connect to the server
  try {
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
 *添加数据到数据库
 * @param { Array} data
 * @returns string
 */
 const insertOne = async (data) => {
  try {
    // Use connect method to connect to the server
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
 * 清空数据库
 */
const deleteMany = async () => {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  await collection.deleteMany();
  client.close();
  return "done.";
};
/**
 * 获取数据集
 * @returns array
 */
const getData = async () => {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  const array = await collection.find().toArray();
  client.close();
  return array;
};
//把方法暴露出去
// module.exports = {
//   insertMany,
//   getData,
//   deleteMany,
// }
export {
  insertMany,
  insertOne,
  getData,
  deleteMany,
}
