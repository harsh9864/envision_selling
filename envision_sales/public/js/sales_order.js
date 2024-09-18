var income_account = "";
frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        if(frm.doc.docstatus == 1){
            frm.add_custom_button(__("Proforma Invoice"), function() {
                proforma_invoice_creation(frm.doc);
            }, __("Create"));
        }
    },
    before_save:function(frm){
        console.log(frm.doc.net_total);
        frm.set_value("custom_outstanding_total", frm.doc.net_total);
    },
});

function proforma_invoice_creation(sales_order) {
    frappe.call({
        method: "envision_sales.public.py.sales_doc_creator.create_proforma_invoice",
        args: {
            sales_order: sales_order.name
        },
        callback: function(response) {
            if (response.message) {
                // Redirect to the newly created Proforma Invoice
                frappe.set_route("Form", "Proforma Invoice", response.message);
            }
        }
    });
}




