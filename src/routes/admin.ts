import express from 'express'
import { adminAuthority, getUserInfoByUserId, roleList } from '../controller/admin.controller.js'

const router = express.Router()

router.post('/admin', ...adminAuthority)
router.get('/admin/roles', ...roleList)
router.get('/admin/user', ...getUserInfoByUserId)

export default router
