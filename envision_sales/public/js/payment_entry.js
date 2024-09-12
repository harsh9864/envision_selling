
frappe.ui.form.on("Payment Entry", {

    validate: function(frm) {
        console.log(frm.doc.name);
    },
    on_submit: function(frm) {
        if(frm.doc.custom_proforma_invoice && frm.doc.custom_is_payment_against_proforma_invoice == 1){
            console.log("Cancelled: ",frm.doc.name);
            frappe.call({
                method: "envision_sales.public.py.sales_doc_creator.updating_proforma_invoice_outstanding_amount",
                args: {
                    proforma_invoice: frm.doc.custom_proforma_invoice,
                    amount: frm.doc.paid_amount * -1
                },
                callback:function(response){
                    console.log("Success::  ",response);
                }
            });

        }
    },
    after_cancel: function(frm) {
        console.log("Cancelled: ",frm.doc.name);
        frappe.call({
            method: "envision_sales.public.py.sales_doc_creator.updating_proforma_invoice_outstanding_amount",
            args: {
                proforma_invoice: frm.doc.custom_proforma_invoice,
                amount: frm.doc.paid_amount 
            },
            callback:function(response){
                console.log("Success::  ",response);
            }
        });
    }
});