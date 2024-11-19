frappe.ui.form.on("Sales Invoice", {
    refresh: function(frm) {
        frm.add_custom_button('Proforma Invoice', () => {
            proforma(frm);            
        }, 'Get Items From');
        frm.set_query("custom_sales_order", function() {
            return {
                filters: {
                    'docstatus': ['=', 1]
                }
            }
        })
    },
    on_submit: function(frm) {
        if(frm.doc.custom_dependent_sales_order && frm.doc.custom_sales_order){
            frappe.call({
                method:"envision_sales.envision_sales.doctype.proforma_invoice.proforma_invoice.update_outstanding_total_in_SO",
                args:{
                    sales_order:frm.doc.custom_sales_order,
                    grand_total:frm.doc.net_total
                },
            });
        }
    }

});

function proforma(frm) {
    var proformabtn = new frappe.ui.form.MultiSelectDialog({
        doctype: 'Proforma Invoice',
        target: frm,
        setters: {
        customer: frm.doc.customer,
        },
        add_filters_group: 1,
        date_field: "posting_date",
        columns: ['name'],  
        get_query() {
            return {
                filters: { docstatus: ['=', 1] }
            };
        },
        action(selections) {
            if (selections && selections.length > 0) {
                frm.clear_table("items");
                frappe.call({
                    'method' : 'envision_sales.public.py.sales_doc_creator.get_items_from_proforma',
                    args: {
                        "list": selections,
                    },
                    callback: function(r) {
                        let data = r.data;
                        // Dictionary to store merged items
                        let item_map = {};
                        // Loop through data to merge items with the same item_code
                        for (let i = 0; i < data.length; i++) {
                            let item = data[i];
                            // If the item_code already exists in item_map, sum the quantities
                            if (item_map[item.item_code]) {
                                item_map[item.item_code].qty += item.qty;
                                item_map[item.item_code].amount = item_map[item.item_code].rate * item_map[item.item_code].qty;
                            } else {
                                // If it's a new item_code, add it to the map
                                item_map[item.item_code] = Object.assign({}, item);  // Clone the item to avoid reference issues
                            }
                        }
            
                        // Convert the item_map back to an array
                        let resultant_item_data = Object.values(item_map);
                        frm.clear_table("items");
                        for (let i = 0; i < resultant_item_data.length; i++) {
                            let row = frm.add_child("items");
                            row.item_code = resultant_item_data[i].item_code;
                            row.item_name = resultant_item_data[i].item_name;
                            row.qty = resultant_item_data[i].qty;
                            row.rate = resultant_item_data[i].rate;
                            row.amount = resultant_item_data[i].amount;
                            row.uom = resultant_item_data[i].uom;
                            row.stock_uom = resultant_item_data[i].stock_uom;
                            row.conversion_factor = resultant_item_data[i].conversion_factor;
                        }
            
                        proformabtn.dialog.hide();
                        frm.refresh_field('items');
                    },
                });
            }
        }
    });
    proformabtn.show();
}
