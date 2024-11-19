// Copyright (c) 2024, Dhruvil Mistry and contributors
// For license information, please see license.txt

frappe.ui.form.on("Proforma Invoice", {
	refresh: function(frm) {
		// Check if the document is submitted (docstatus == 1)
		if (frm.doc.docstatus == 1) {
			// Add a custom button to create a Sales Invoice
			frm.add_custom_button(__("Sales Invoice"), function() {
				// Call the function to create a Sales Invoice using the current Proforma Invoice
				create_sales_invoice(frm.doc);
			}, __("Create"));

			// Add a custom button to create a Payment Entry
			frm.add_custom_button(__("Payment Entry"), function() {
				// Call the function to make a Payment Entry for the current Proforma Invoice
				make_payment_amount(frm.doc);
			}, __("Create"));
		}
	},
	customer:function(frm){
        // Fetch the customer's debit account based on the selected customer and company
        debit_account = fetchCustomerAccount(frm.doc.customer, frm.doc.company);
        
        if (debit_account) {
            // If a debit account is found, log it to the console and set it in the form
            frm.set_value("debit_to", debit_account);
        }
        else {
            // If no customer-specific account is found, fetch the default company account
            frappe.db.get_doc("Company", frm.doc.company).then(doc => {
				frm.set_value("debit_to", doc.default_receivable_account);
            });
        }
    },

	before_save:function(frm){
		// Get the list of items in the Proforma Invoice
		var row = frm.doc.items;
		// Initialize variables to store total quantity and total amount
		total_qty = total_amount = 0;
		// Iterate over each item in the table
		row.forEach(data => {
			// Calculate total quantity and total amount
			total_qty += data.qty;
			total_amount += data.amount;
		});
		// Set calculated totals on the form fields
		frm.set_value("total_qty", total_qty);
		frm.set_value("total", total_amount);
		frm.set_value("net_total", total_amount);
		frm.set_value("grand_total", total_amount);
		frm.set_value("outstanding_amount", total_amount);
		frm.set_value("base_grand_total", total_amount);
		frm.set_value("base_rounding_adjustment", total_amount);
		frm.set_value("base_rounded_total", total_amount);
		if(total_amount > frm.doc.sales_order_grand_total){
			frappe.throw({
				title: __("Overbilling"),
				message: __("The Sum of all Proforma Invoices should be less or equal to Sales Order Grand Total.")
			});
		}
	},
	before_submit: function(frm) {
		// Ensure required fields are present and properly validated
		if (frm.doc.sales_order && frm.doc.sales_order_grand_total && frm.doc.total_amount) {
			if (frm.doc.total_amount > frm.doc.sales_order_grand_total) {
				frappe.throw({
					title: __("Overbilling"),
					message: __("The Sum of all Proforma Invoices should be less or equal to Sales Order Grand Total.")
				});
			}
		}
	},	
	on_submit: function(frm) {
		frappe.call({
			method:"envision_sales.envision_sales.doctype.proforma_invoice.proforma_invoice.update_outstanding_total_in_SO",
			args:{
				sales_order:frm.doc.sales_order,
				grand_total:frm.doc.grand_total
			},
		});
	}
});

frappe.ui.form.on("Sales Invoice Item", {
    // Triggered when the item_code field is changed
	item_code: function(frm, cdt, cdn) {
		// Get the current row data (child table entry) using cdt (doctype) and cdn (docname)
		const item_data = locals[cdt][cdn];

		// Set the 'qty' field in the items grid as mandatory
		frm.fields_dict['items'].grid.update_docfield_property('qty', 'mandatory', 1);

		// Refresh the 'items' field to reflect the changes
		frm.refresh_field("items");

		// Call a custom function to fetch additional data for the selected item code
		fetchItemData(frm, cdt, cdn, item_data.item_code);
	},

    // Triggered when the qty (quantity) field is changed
	qty: function(frm, cdt, cdn) {
		// Get the current row data for the quantity and rate
		const item_data = locals[cdt][cdn];
		// Call a custom function to calculate and update amounts based on the new quantity and rate
		calculateAndSetAmounts(frm, cdt, cdn, item_data.qty, item_data.rate);
	},
    // Triggered when the rate field is changed
	rate: function(frm, cdt, cdn) {
		// Get the current row data for the quantity and rate
		const item_data = locals[cdt][cdn];
		// Call a custom function to calculate and update amounts based on the new rate and quantity
		calculateAndSetAmounts(frm, cdt, cdn, item_data.qty, item_data.rate);
	}
});

function fetchItemData(frm, cdt, cdn, item_code) {
	frappe.call({
		method: "frappe.client.get",
		args: {
			doctype: "Item",
			name: item_code
		},
		callback: function(response) {
			if (response && response.message) {
				const result_data = response.message;
				console.log(result_data);
				setItemFields(frm, cdt, cdn, result_data);
				setAccountFields(frm, cdt, cdn, result_data);
			} else {
				console.log("Null");
				frappe.model.set_value(cdt, cdn, 'item_code', '');  
			}
		}
	});
}

function setItemFields(frm, cdt, cdn, result_data) {
	const fields = {
		'item_name': result_data.item_name,
		'description': result_data.description,
		'image_view': result_data.image,
		'item_group': result_data.item_group,
		'gst_hsn_code': result_data.gst_hsn_code,
		'stock_uom': result_data.stock_uom,
		'uom': result_data.stock_uom,
		'conversion_factor': 1,
		'cost_center': frm.doc.cost_center,
		'project': frm.doc.project
	};

	for (let field in fields) {
		frappe.model.set_value(cdt, cdn, field, fields[field]);
	}
}

function setAccountFields(frm, cdt, cdn, result_data) {
	if (result_data.item_defaults && result_data.item_defaults.length > 0) {
		result_data.item_defaults.forEach(data => {
			if(data.company == frm.doc.company){
				if(data.income_account || data.expense_account) {
					frappe.model.set_value(cdt, cdn, 'income_account', data.income_account || getCompanyDefault(frm.doc.company, 'default_income_account'));
					frappe.model.set_value(cdt, cdn, 'expense_account', data.expense_account || getCompanyDefault(frm.doc.company, 'default_expense_account'));
				} else {
					setDefaultAccounts(frm, cdt, cdn);
				}
			}
		});
	}
}

function setDefaultAccounts(frm, cdt, cdn) {
	getCompanyDefaults(frm.doc.company).then(doc => {
		frappe.model.set_value(cdt, cdn, 'income_account', doc.default_income_account);
		frappe.model.set_value(cdt, cdn, 'expense_account', doc.default_expense_account);
	});
}

function getCompanyDefaults(company) {
	return frappe.db.get_doc('Company', company);
}

function getCompanyDefault(company, fieldname) {
	return frappe.db.get_value('Company', company, fieldname).then(r => r.message[fieldname]);
}

function calculateAndSetAmounts(frm, cdt, cdn, qty, rate) {
	const amount = rate * qty;
	const fields = {
		'rate': rate,
		'amount': amount,
		'base_rate': rate,
		'base_amount': amount,
		'discount_amount': 0
	};

	for (let field in fields) {
		frappe.model.set_value(cdt, cdn, field, fields[field]);
	}
}

function fetchCustomerAccount(customer,company){
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Customer",
            name: customer
        },
        callback: function(response) {
            if (response && response.message) {
                const result_data = response.message;
                console.log(result_data.accounts);
                result_data.accounts.forEach(data => {
                    if(data.company == company){
                        console.log(data.account)
                        return data.account
                    }
                });
            }
        }
    });
}

function create_sales_invoice(proforma_invoice) {
    // Make a server-side call to create a Sales Invoice based on the given Proforma Invoice
    frappe.call({
        method: "envision_sales.public.py.sales_doc_creator.create_sales_invoice",  // Specify the method to be called
        args: {
            proforma_invoice: proforma_invoice.name  // Pass the name of the Proforma Invoice as an argument
        },
        callback: function(response) {
            // This function runs after the server responds
            if (response.message) {
                // If a Sales Invoice is successfully created, redirect to the newly created Sales Invoice
                frappe.set_route("Form", "Sales Invoice", response.message);
            }
        }
    });
}

function make_payment_amount(proforma_invoice) {
    // Create a dialog to capture the payment details from the user
    let d = new frappe.ui.Dialog({
        title: 'Enter details',
        fields: [
            {
                label: 'Payment Amount',  // Field for entering the payment amount
                fieldname: 'payment_amount',
                fieldtype: 'Currency'
            },
            {
                label: 'Work Order',  // Field for entering/selecting the related Sales Order (work order)
                fieldname: 'work_order',
                fieldtype: 'Link',
                options: 'Sales Order',
                default: proforma_invoice.sales_order,  // Set the default to the sales order from the proforma_invoice
				reqd: 1
            },
        ],
        size: 'small',  // Size of the dialog
        primary_action_label: 'Submit',  // Label for the primary button in the dialog
        primary_action(values) {
            // This function is triggered when the user clicks the "Submit" button
            var amount = values.payment_amount;

            // Check if the entered amount is greater than the outstanding amount
            if (amount > proforma_invoice.outstanding_amount) {
                frappe.throw("Payment Amount should be less or equal to Proforma Invoice");
				// Stop execution if amount is invalid
                return 0;  
            }
            // Check if the entered amount is zero
			else if (amount == 0) {
				frappe.throw("Payment Amount can't be zero");
				return 0;  // Stop execution if amount is zero
			}

            d.hide();  // Hide the dialog after successful validation
            create_payment(proforma_invoice, amount);  // Call the function to create the payment
        }
    });

    d.show();  // Show the dialog to the user
}

function create_payment(proforma_invoice, amount) {
    // Call the server-side method to create a Payment Entry
    frappe.call({
        method: "envision_sales.public.py.sales_doc_creator.create_payment_entry",  // Method to create payment entry
        args: {
            proforma_invoice: proforma_invoice.name,  // Pass the proforma invoice name as an argument
            amount: amount,  // Pass the payment amount
            sales_order: proforma_invoice.sales_order  // Pass the associated sales order
        },
        callback: function(response) {
            // This function runs after the server responds
            if (response.message) {
                // If a Payment Entry was successfully created, navigate to its form
				
                frappe.set_route("Form", "Payment Entry", response.message);
            }
        }
    });
	
}
