const mongoose = require('mongoose');
const deliveryRequestSchema=new mongoose.Schema({
    itemDescription:{
        type:String,
        required:true
    },
    outlet:{
        type:String,
        required:true
    },
    hostel:{
        type:String,
        required:true
    },
    fee:{
        type:Number,
        required:true
    },
    status:{
        type: String,
        enum: ['OPEN','ACCEPTED'],
        default:'OPEN'
    }
},{timestamps:true});
module.exports=mongoose.model('DeliveryRequest',deliveryRequestSchema);