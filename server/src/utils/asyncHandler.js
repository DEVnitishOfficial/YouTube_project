
const asyncHandler = (requestHandler) =>{
   return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export{
    asyncHandler
}

// const asyncHandler = (fn) => async(err,req,res,next) => { // here i have used higher order function
// try{
//     await fn(err,req,res,next)
// }catch(error){
//     res.status(err.code || 500).json({
//         success:false,
//         message:err.message
//     })
// }
// }