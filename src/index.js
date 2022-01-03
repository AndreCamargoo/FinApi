const { request, response } = require('express')
const express = require('express')
const { v4: uuidv4 } = require("uuid")

const app = express()
app.use(express.json())

const customers = []

//Middleware
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers

    const customer = customers.find(
        (customer) => customer.cpf === cpf
    )

    if(!customer) return response.status(400).json({
        "error": "Customer not found"
    })

    request.customer = customer

    return next()
}

function getBalance(statement) {
    const balance = statement.reduce( (acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount
        } else {
            return acc - operation.amount
        }
    }, 0)  

    return balance
}

//Router

/**
 * cpf = string
 * name = string
 * id = uuid
 * statement = array
 */
app.post('/account', (request, response) => {

    const {cpf, name} = request.body
    const id = uuidv4()
    
    const customerAlreadyExists = customers.some( 
        (customers) => customers.cpf === cpf 
    )

    if(customerAlreadyExists) return response.status(400).send({
        "error": "Customers already exists"
    }) 


    customers.push({
        cpf,
        name,
        id,
        statement: []
    })

    return response.status(201).send()

})

//app.use(verifyIfExistsAccountCPF)

/**
 * HEADERS
 * cpf = string
 */
app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
    
    const { customer } = request
    return response.json(customer.statement)

})

/**
 * HEADERS
 * cpf = string
 * 
 * BODY
 * description = string
 * amount = float
 */
app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {

    const { description, amount } = request.body
    const { customer } = request

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()

})

/**
 * HEADERS
 * cpf = string
 * 
 * BODY
 * amount = float
 */
app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {

    const { amount } = request.body
    const { customer } = request

    const  balance = getBalance(customer.statement)

    if(balance < amount) return response.status(400).json({
        "error": "Insufficient funds!"
    })

    const statementOperation = {
        "description": "Saque",
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()

})

/**
 * HEADERS
 * cpf = string
 * 
 * QUERY
 * date = string
 */
 app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    const { date } = request.query
    
    const dateFormat = new Date(date + " 00:00")

    const statement = customer.statement.filter(
        (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    )

    return response.json(statement)
 })

 /**
 * HEADERS
 * cpf = string
 * 
 * BODY
 * name = string
 */
 app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    const { name } = request.body

    customer.name = name

    return response.status(201).send()
 })

 /**
 * HEADERS
 * cpf = string
 */
 app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request

    return response.json(customer)    
})

 /**
 * HEADERS
 * cpf = string
 */
app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request

    const indexCustumer = customers.findIndex(
        custumerIndex => custumerIndex.cpf === customer.cpf
    )

    customers.splice(indexCustumer, 1)  

    return response.status(204).send()
})

 /**
 * HEADERS
 * cpf = string
 */
app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request

    const balance = getBalance(customer.statement)

    return response.json({
        "Balance": balance
    })
})

 /**
 * HEADERS
 * cpf = string
 */
app.get('/allAccount', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request

    return response.json(customers)
})

app.listen(3333)