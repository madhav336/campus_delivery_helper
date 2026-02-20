const express=require('express');
const router=express.Router();
const DeliveryRequest=require('../models/DeliveryRequest');

router.post('/',async(req,res)=>{
    try{
        const request=await DeliveryRequest.create(req.body);
        res.status(201).json(request);
    }
    catch(error){
        res.status(400).json({error:error.message});
    }
});
router.get('/',async(req,res)=>{
    try{
        const requests=await DeliveryRequest.find({status:'OPEN'});
        res.json(requests);
    }
    catch(error){
        res.status(500).json({error:error.message});
    }
});
router.put('/:id',async (req,res)=>{
    try{
        const updatedRequest = await DeliveryRequest.findByIdAndUpdate(
          req.params.id,
          req.body,
          {new:true,runValidators:true}  
        );
        if(!updatedRequest){
            return res.status(404).json({message:"Request not found"});
        }
        res.json(updatedRequest);
    }
    catch(error){
        res.status(400).json({error:error.message});
    }
});
router.delete('/:id',async(req,res)=>{
    try{
        const deletedRequest= await DeliveryRequest.findByIdAndDelete(req.params.id);
        if(!deletedRequest){
            return res.status(404).json({message: "Request not found"});
        }
        res.json({message:"Request deleted successfully"});
    }
    catch(error){
        res.status(500).json({error:error.message});
    }
});
module.exports=router;