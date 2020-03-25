const express = require('express')
const app = express()
const Joi = require('joi')
const AWS = require('aws-sdk')
const UUIDv4 = require('uuid/v4')
const cors = require('cors')

const awsconfig = {
    "region": "ap-south-1",
    "endpoint": "http://dynamodb.ap-south-1.amazonaws.com/",
    "accessKeyId": "AKIA6QO4D6HKWV7EDQ3F",
    "secretAccessKey": "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"
};

AWS.config.update(awsconfig)
var docClient = new AWS.DynamoDB.DocumentClient();

var table = "employees";

app.use(express.json())
app.use(cors())

//Get All Employees
app.get('/', (req,res) => {
    
    var params = {
        TableName: table
    }
    //Aws scan
    docClient.scan(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2))
            res.send(data)
        }
    })
})

//Get Employee with ID
app.get('/:id', (req, res) => {

    var params = {
        TableName: table,
        Key: {
            "id":req.params.id
        }
    };
    //Aws get
    docClient.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2))
            const result = data.Item
            if(result != null) {
                res.status(200).send(result)
            }else {
                res.status(404).send('Not Found with id: ' + params.Key.id)
            }
        }
    })
})

//Create new Employee
app.post('/add', (req,res) => {

    //Validation
    const {error} = validation(req.body)

    if(error) {
        res.status(400).send(error.details[0].message)
        return
    } 

    const id = UUIDv4()
    const params = {
        TableName: table,
        Item: {
            id: id,
            name: req.body.name,
            email: req.body.email,
            age: req.body.age,
            salary: req.body.salary
        }
    }

    docClient.put(params, function (err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2))
            res.status(400).send(err)
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2))
            res.status(200).send(params.Item.id)
        }
    })
})

//Update Employee
app.put('/update/:id', (req,res) => {

    //Search for Employee with ID
    const serachParms ={
        TableName: table,
        Key: {
            id: req.params.id
        }
    }

    docClient.get(serachParms, (err,data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
        } else {
            //console.log("GetItem succeeded:", JSON.stringify(data, null, 2))
            if(data.Item != null) {
                console.log('Found')
                update(req,res)
            } else {
                console.log('Not Found')
                res.status(404).send('Not Found')
            }
        }
    })

})

function update(req,res) {

    // const {error} = validation(req.body)

    // if (error) {
    //     res.status(400).send(error.details[0].message)
    //     return
    // }

    //Update
    const params = {
        TableName: table,
        Key: {
            id: req.params.id
        },
        UpdateExpression: "set email = :e,age = :a,salary = :s",
        ExpressionAttributeValues: {
            ":e": req.body.email,
            ":a": req.body.age,
            ":s": req.body.salary
        },
        ReturnValues: "UPDATED_NEW"
    }

    docClient.update(params, (err, data) => {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2))
            res.status(400).send('Unable to Update')
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2))
            res.status(200).send(data)
        }
    })
}

//Delete Employee
app.delete('/delete/:id', (req,res) => {
    const params = {
        TableName: table,
        Key: {
            "id":req.params.id
        }
    }

    docClient.delete(params, (err,data) => {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2))
            res.status(400).send('Error while deleting')
        } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2))
            res.status(200).send('deleted successfully')
        }
    })
})

//Check input validation
function validation(employee) {
    const schema = {
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.string().required(),
        salary: Joi.string().required()
    }

    return Joi.validate(employee,schema)
}

app.listen(3030,() => console.log("http://localhost:"+3030))