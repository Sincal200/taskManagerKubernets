const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const TaskSchema = new Schema({
    title:{type:String,required:true},
    description:{type:String,required:true},
    status:{type:String,required:true},
    datetime:{type:Date,required:true},

});

const TaskModel = model('Task',TaskSchema);

module.exports = TaskModel;