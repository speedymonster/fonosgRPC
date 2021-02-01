const interceptors = require('@pionerlabs/grpc-interceptors');
const  grpc = require('grpc');
const path = require('path');
require('dotenv').config()
const User = require("./models/User");
var jwt = require('jsonwebtoken');

const PROTO_PATH = "C:\\Users\\RaulSanchez\\Desktop\\Proyectos\\Pruebas\\gRPC Fonos\\server\\fonos.proto";
const server = interceptors.serverProxy(new grpc.Server());
var protoLoader = require("@grpc/proto-loader");
const mongoose = require("mongoose") // new

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var fonosProto = grpc.loadPackageDefinition(packageDefinition);
const customers = [
    {
        id: "a68b823c-7ca6-44bc-b721-fb4d5312cafc",
        name: "John Bolton",
        age: 23,
        address: "Address 1"
    },
    {
        id: "34415c7c-f82d-4e44-88ca-ae2a1aaa92b7",
        name: "Mary Anne",
        age: 45,
        address: "Address 2"
    }
];
const authorizations = async function (ctx, next) {

    // do stuff before call
    console.log('Making gRPC call...');
    let meta = ctx.call.metadata._internal_repr;
    
    let data = await User.findOne({accessKeyId: meta.access_key_id}); 
    await next()

    /*if(!data){
        errorCb({
            code: grpc.status.INTERNAL,
            message: 'Some error occurred!'
        });
    }else{

    }
    */
    console.log(data);

    // do stuff after call
}

server.addService(fonosProto.CustomerService.service, {
    getAll: (_, callback) => {
        callback(null, { customers });
    }
});

server.addService(fonosProto.LoginService.service, {
    Login: (call, callback) => {
        let request = call.request;
        let user  = {};
        console.log(request);
        User.findOne({
            username: request.username,
            password: request.password
        }).then(result =>{
            if(!result){
                console.log(result);
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "User not found"
                })
            }else{
                let token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + (60 * 60),
                    data: result
                  }, 'secret');

                  let returnObject = {
                      name: result.name,
                      ref: result.ref,
                      accessKeyId: result.accessKeyId,
                      token: token
                  };
                  console.log(returnObject);
                  callback(null, returnObject);
            }
        }).catch(err =>{
            console.log(err);
        })
    },
});

server.use(authorizations);


mongoose
	.connect(process.env.mongodb, { useNewUrlParser: true })
	.then(() => {
        server.bind('127.0.0.1:50051', grpc.ServerCredentials.createInsecure())
        console.log('Server running at http://127.0.0.1:50051')
		server.start()
	})
