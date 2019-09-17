var Saleinstance = require('../../models/datamodels/saleinstance');
var Product = require('../../models/datamodels/product');
var Pricelist = require('../../models/datamodels/pricelist');

module.exports = {
    salecount(req, res, next) {
        const orderprops = req.body.orderprops;
        const cartitems = orderprops.cartitems;
        var something = cartitems.map((cartitem) => {
            const productid = cartitem.productid;
            var decrement = cartitem.decrement;
            Product.findById({ _id: productid })
                .populate('saleinstance')
                .then((myproduct) => {
                    if (myproduct.saleinstance.length != 0) {
                        var saleinstance = myproduct.saleinstance;
                        var arraylist = [];
                        for (i = 0; i < saleinstance.length || decrement != 0; i++) {            
                            var instanceid = saleinstance[i]._id;
                            var currentvolume = saleinstance[i].salevolume;
                            if (currentvolume <= decrement) {
                                decrement = decrement - currentvolume;
                                console.log(`in the current volume <= decrement ${decrement}, ${i}`);
                                Saleinstance.findById({ _id: instanceid })
                                    .then((saleinstance) => {
                                        if (saleinstance.pricelist.length != 0) {
                                            var listids = saleinstance.pricelist;
                                            console.log(`in the current volume 2nd <= decrement ${decrement}, ${i}`);
                                            arraylist.push(Saleinstance.findByIdAndRemove({ _id: instanceid })
                                                .then(() => {
                                                    return Product.findById({ _id: productid })
                                                })
                                                .then((myproduct) => {
                                                    myproduct.saleinstance.pull({ _id: instanceid });
                                                    return myproduct.save()
                                                })
                                                .then(() => {
                                                    return Pricelist.deleteMany({ _id: { $in: listids } })
                                                })
                                            .then((response) => {
                                                return Promise.resolve(response);
                                            }));
                                        } else if (saleinstance.pricelist.length == 0) {
                                            console.log(`in the current volume 3rd <= decrement ${decrement}, ${i}`);
                                            arraylist.push(Saleinstance.findByIdAndRemove({ _id: instanceid })
                                                .then(() => {
                                                    return Product.findById({ _id: productid })
                                                })
                                                .then((myproduct) => {
                                                    myproduct.saleinstance.pull({ _id: instanceid });
                                                    return myproduct.save()
                                                }));
                                            // .then((response) => {
                                            //     return Promise.resolve(response);
                                            // });
                                        }
                                    });
                            } else if (currentvolume > decrement) {
                                console.log(`in the current volume > decrement ${decrement}, ${i}`);
                                currentvolume -= decrement;
                                decrement = 0;
                                console.log(currentvolume);
                                console.log(decrement);
                                arraylist.push(Saleinstance.findByIdAndUpdate({ _id: instanceid }, { $set: { salevolume: currentvolume } }))
                                // .then((response) => {
                                //     return Promise.resolve(response);
                                // }));
                                return;
                            }
                        }
                        console.log(arraylist);
                        return Promise.all(arraylist);
                    }
                    if (myproduct.saleinstance.length == 0) {
                        return Promise.resolve();
                    }
                }).then((v) => {
                    console.log(`after promise all ${v}`);
                }).catch((e) => {
                    console.log(e);
                });
        });
        next();
    }
};

