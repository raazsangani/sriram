var Saleinstance = require('../../models/datamodels/saleinstance');
var Product = require('../../models/datamodels/product');
var Pricelist = require('../../models/datamodels/pricelist');

module.exports = {
    salescount: async function (req, res, next) {
        try {
            console.log(req.body.orderprops);
            const userid = req.user._id;

            const orderprops = req.body.orderprops;
            const cartitems = orderprops.cartitems;
            try {
                await Promise.all(cartitems.map(async (cartitem) => {
                    const productid = cartitem.productid;
                    var decrement = cartitem.decrement;
                    var myproduct = await Product.findById({ _id: productid })
                        .populate('saleinstance');
                    // var arraylist = [];
                    async function orderitems() {
                        for (i = 0; i < myproduct.saleinstance.length && decrement != 0; i++) {
                            console.log(myproduct.saleinstance);
                            var saleinstance = myproduct.saleinstance;
                            if (saleinstance.length != 0) {
                                var instanceid = saleinstance[i]._id;
                                var currentvolume = saleinstance[i].salevolume;
                                if (currentvolume <= decrement) {
                                    decrement = decrement - currentvolume;
                                    console.log(`this is excess decrement ${decrement},${i}`);
                                    var saleinstance = await Saleinstance.findById({ _id: instanceid });
                                    if (saleinstance.pricelist.length != 0) {
                                        var listids = saleinstance.pricelist;
                                        console.log(`in the 1st statement  ${decrement} , ${i}`);
                                        const removeinstance = await Saleinstance.findByIdAndRemove({ _id: instanceid });
                                        const myproduct = await Product.findById({ _id: productid });
                                        myproduct.saleinstance.pull({ _id: instanceid });
                                        const saveproduct = await myproduct.save();
                                        const deletelist = await Pricelist.deleteMany({ _id: { $in: listids } });
                                        await Promise.all([removeinstance, myproduct, saveproduct, deletelist]);
                                    }
                                    else if (saleinstance.pricelist.length == 0) {
                                        console.log(`in the 2nd statement  ${decrement} , ${i}`);
                                        const removeinstance = await Saleinstance.findByIdAndRemove({ _id: instanceid });
                                        const myproduct = await Product.findById({ _id: productid });
                                        myproduct.saleinstance.pull({ _id: instanceid });
                                        const saveproduct = await myproduct.save();
                                        await Promise.all([removeinstance, myproduct, saveproduct]);
                                    }
                                }
                                else if (currentvolume > decrement) {
                                    currentvolume -= decrement;
                                    console.log(`the current volume of the saleinstance ${currentvolume},${i}`);
                                    console.log(`decrement of saleinstance ${decrement},${i}`);
                                    try {
                                        const updateinstance = await Saleinstance.findByIdAndUpdate({ _id: instanceid }, { $inc: { salevolume: -decrement } });
                                        await Promise.all([updateinstance]);

                                    } catch (err) {
                                        console.log(err);
                                    }
                                    decrement = 0;
                                    return;
                                }
                                // await Promise.all(arraylist);
                                // console.log(`############################${arraylist.length}`);
                                // arraylist.pop();
                                // console.log(`############################${arraylist.length}`);
                            }
                        }
                    }
                    orderitems();

                    next();

                })); //change here
                // res.status(200).json({
                //     message: "everything working fine."
                // })
            } catch (err) {
                res.status(400).json({
                    error: err,
                    message: "something went wrong."
                })
            }
        } catch (err) {
            console.log(err);
        }
    }
};
