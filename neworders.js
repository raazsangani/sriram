                                var something = cartitems.map((cartitem) => {
                                    const productid = cartitem.productid;
                                    const decrement = cartitem.decrement;
                                    Product.findById({ _id: productid })
                                        .populate({ path: 'batches', options: { sort: { 'entrydate': -1 } } })
                                        .then((product) => {
                                            console.log(product);
                                            console.log(decrement);         
                                            for (i = 0; decrement > 0 ; i++) {
                                                const batchid = product.batches[i]._id;
                                                const stock = product.batches[i].stockentry;

                                                if ( product.batches[i].stockentry  < decrement ) {
                                                    decrement -= stock; // should write
                                                    Batch.findByIdAndUpdate({ _id: batchid }, { $inc: { stockentry: -stock } })
                                                    .then((batch) => console.log(batch)).catch((e) => console.log(e));
                                               stock = 0; // to update
                                            }
                                            else if (product.batches[i].stockentry  >= decrement) {
                                                decrement = 0;
                                                /*update your batch stock value here in DB*/
                                                    product.batches[i].stock -= decrement;
                                                    console.log(product.batches[i].stock);
                                                    Batch.findByIdAndUpdate({ _id: batchid }, { $set : { stockentry: -product.batches[i].stock } })
                                                    .then((batch) => console.log(batch)).catch((e) => console.log(e));
                                                    if (product.batches[i].stockentry == 0) {
                                                        Batch.findByIdAndRemove({ _id: batchid })
                                                            .then(() => {
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
                                                /* This condition is to check corner case */
                                                if ((i == product.batches.length - 1) && product.batches[i].stock == 0) {
                                                    Product.findByIdAndUpdate({ _id: productid }, { $set: { available: false }})
                                                    .then(() => console.log("updated value")).catch((e) => console.log(e));
                                                }
                                                break; // exit from loop or return 
                                             }
                                             if ( i == product.batches.length - 1 ) {  
                                                decrement = 0;  
                                                Product.findByIdAndUpdate({ _id: productid }, { $set: { available: false }})
                                                .then(() => console.log("updated value")).catch((e) => console.log(e));
                                                break; // exit or return from loop
                                             }
                                             }
