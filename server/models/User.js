const mongoose = require("mongoose")
const { stringify } = require("uuid")

const schema = mongoose.Schema({
	ref: String,
    name: String,
    accessKeyId: String,
    username: String,
    password:String,
    roles: String,
    created_time: Date,
    updated_time:Date
})

module.exports = mongoose.model("user", schema)