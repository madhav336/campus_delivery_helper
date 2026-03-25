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
        enum: ['OPEN','IN_PROGRESS','COMPLETED'],
        default:'OPEN'
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
},{timestamps:true});
module.exports=mongoose.model('DeliveryRequest',deliveryRequestSchema);