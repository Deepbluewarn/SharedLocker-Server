import mqtt from "mqtt"
import AuthService from '../services/auth.services.js'
import LockerService from '../services/locker.services.js'
import { Types } from "mongoose"

import dotenv from 'dotenv'
dotenv.config()

const clientId = 'emqx_nodejs_' + Math.random().toString(16).substring(2, 8)
const username = process.env.MQTT_USERNAME
const password = process.env.MQTT_PASSWORD

const sub_topic = 'sharedLocker-request'
const pub_topic = 'sharedLocker-response'
const qos = 0

const client = mqtt.connect(process.env.MQTT_CONNECT, {
    clientId,
    username,
    password,
})

client.subscribe(sub_topic, { qos }, (error) => {
    if (error) {
        console.log('subscribe error:', error)
        return
    }
    console.log(`Subscribe to topic '${sub_topic}'`)
})

client.on('message', async (topic, payload) => {
    console.log('Received Message:', topic, payload.toString())

    try {
        const request_obj = JSON.parse(payload.toString())
        const buildingNumber: number = Number(request_obj.buildingNumber);
        const floor: number = Number(request_obj.floor);
        const lockerNumber: number = Number(request_obj.lockerNumber);

        let response;

        if (topic === sub_topic) {
            const redisUserId = await AuthService.getUserIdByQrKey(request_obj.key)

            if (!redisUserId) {

                // res.status(400).json({ success: false, message: 'QR키가 유효하지 않습니다.' })
                response = { success: false, message: 'QR키가 유효하지 않습니다.' }
            }

            // mongoose userid 생성
            const userId = new Types.ObjectId(redisUserId)

            response = await LockerService.checkLockerAccessByUserId(userId, buildingNumber, floor, lockerNumber)

            client.publish(pub_topic, JSON.stringify(response), { qos }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
        }
    } catch (error) {
        client.publish(pub_topic, JSON.stringify({
            success: false, message: error.message
        }))
    }
})