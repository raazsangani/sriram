    placeorder(req, res, next) {
        const userid = req.user._id;
        const orderprops = req.body.orderprops;
        const myorders = new Orders(orderprops);
        User.findById({ _id: userid })
            .then((myuser) => {
                myuser.orders.push(myorders);
                Promise.all([myuser.save(), myorders.save()])
                    .then((myorders) => {
                        if (myorders[1].orderstatus === "ORDERPLACED") {
                            const orderid = myorders[1]._id;
                            Orders.findById({ _id: orderid })
                                .then((placedorders) => {
                                    const cartitems = placedorders.cartitems;
                                    var something = cartitems.map((cartitem) => {
                                        const productid = cartitem.productid;
                                        const decrement = cartitem.decrement;
                                        Product.findById({ _id: productid })
                                            .populate({ path: 'batches', options: { sort: { 'entrydate': -1 } } })
                                            .then((product) => {
                                                console.log(product);
                                                console.log(decrement);
                                                var difference = decrement;
                                                for (i = 0; difference > 0 ; i++) {
                                                    console.log(`in the first block ${productid}`);
                                                    console.log(product.batches.length);
                                                    if (i < product.batches.length) {
                                                        console.log(product.batches.length);
                                                        const highest = product.batches.length;
                                                        console.log("hi buddy");
                                                        const batchid = product.batches[i]._id;
                                                        const stock = product.batches[i].stockentry;
                                                        if (stock == 0) {
                                                            Batch.findByIdAndRemove({ _id: batchid })
                                                                .then(() => {
                                                                    console.log(`hi mukesh this is the productid ${productid}`);
                                                                    Product.findById({ _id: productid })
                                                                        .then((myproduct) => {
                                                                            myproduct.batches.pull({ _id: batchid });
                                                                            myproduct.save()
                                                                                .then((response) => {
                                                                                    console.log(response);
                                                                                    // res.status(200).json({
                                                                                    //     data: response,
                                                                                    //     message: "successfully ordered."
                                                                                    // })
                                                                                }).catch((e) => console.log(e));
                                                                        })
                                                                        .catch((e) => {
                                                                            res.status(400).json({
                                                                                error: e,
                                                                                message: "something went wrong."
                                                                            })
                                                                            next();
                                                                        });
                                                                }).catch((e) => {
                                                                    res.status(400).json({
                                                                        error: e,
                                                                        message: "something went wrong when ordering."
                                                                    })
                                                                    next();
                                                                });
                                                        }
                                                        if (product.batches[highest].length == 0) {
                                                            console.log(`batch block one ${i}`);
                                                            Product.findByIdAndUpdate({ _id: productid }, { $set: { available: false }})
                                                                .then(() => console.log("updated value")).catch((e) => console.log(e));
                                                                difference = 0;
                                                                return;
                                                        }
                                                        if (stock <= decrement) {
                                                            console.log("batch block two");
                                                            difference = difference - stock;
                                                            Batch.findByIdAndUpdate({ _id: batchid }, { $inc: { stockentry: -stock } })
                                                                .then((batch) => console.log(batch)).catch((e) => console.log(e));
                                                        }
                                                        if (stock > decrement) {
                                                            console.log("batch block three");
                                                            Batch.findByIdAndUpdate({ _id: batchid }, { $inc: { stockentry: -difference } })
                                                                .then((batch) => console.log(batch)).catch((e) => console.log(e));
                                                            difference = 0;
                                                            return;
                                                        }
                                                    }
                                                    else {
                                                        return;
                                                    }
                                                }
                                            }).catch((e) => res.status(400).json({
                                                message: "something went wrong when ordering."
                                            }));
                                    })
                                    res.status(200).json({ // NEED A LOOK HERE..
                                        data: something,
                                        message: "order placed successfully."
                                    })
                                })
                        }
                    })
                    .catch((e) => {
                        res.status(400).json({
                            error: e,
                            message: "something went wrong."
                        })
                        next();
                    });
            }).catch((e) => {
                res.status(400).json({
                    error: e,
                    message: "something went wrong when adding myorders."
                })
                next();
            });
    },
