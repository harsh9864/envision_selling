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

		// Set the query for the "sales_taxes_and_charges_template" field
		frm.set_query("sales_taxes_and_charges_template", function(){
			return {
			"filters": [
				["Sales Taxes and Charges Template", "company", "=", frm.doc.company],
			]
			}
			});
		// Set the query for the "shipping_rule" field
		frm.set_query("shipping_rule", function(){
			return {
			"filters": [
				["Shipping Rule", "company", "=", frm.doc.company],
				["Shipping Rule", "shipping_rule_type", "=", "Selling"]
			]
			}
			});
		// Set the query for the "project" field
		frm.set_query("project", function(){
			return {
			"filters": [
				["Project", "company", "=", frm.doc.company],
			]
			}
			});
		// Set the query for the "cost_center" field
		frm.set_query("cost_center", function(){
			return {
			"filters": [
				["Cost Center", "company", "=", frm.doc.company],
			]
			}
			});
		frm.fields_dict['items'].grid.update_docfield_property(
			'cost_center', 'reqd', 0
		);
		frm.fields_dict['items'].grid.update_docfield_property(
			'qty', 'reqd', 1
		);
		frm.fields_dict['items'].grid.update_docfield_property(
			'income_account', 'reqd', 0
		);
		frm.fields_dict['items'].grid.update_docfield_property(
			'amount', 'reqd', 0
		);
		frm.refresh_field("items");
	},
	customer:function(frm){
        // Fetch the customer's debit account based on the selected customer and company
        debit_account = fetchCustomerAccount(frm.doc.customer, frm.doc.company);
        console.log(debit_account);
        if (debit_account != null) {
            // If a debit account is found, log it to the console and set it in the form
            frm.set_value("debit_to", debit_account);
        }
        else {
            frappe.db.get_value("Company", frm.doc.company, "default_receivable_account")
			.then((response) => {
			let account = response.message.default_receivable_account;
			frm.set_value("debit_to", account);
		});
        }
    },

	sales_taxes_and_charges_template: function (frm) {
        if (frm.doc.sales_taxes_and_charges_template) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Sales Taxes and Charges Template",
                    name: frm.doc.sales_taxes_and_charges_template,
                },
                callback: function (response) {
                    if (response.message) {
                        const tax_template = response.message;
                        frm.clear_table("taxes_and_charges");
                        tax_template.taxes.forEach(tax => {
                            frm.add_child("taxes_and_charges", {
                                charge_type: tax.charge_type,
                                account_head: tax.account_head,
                                description: ("..." || tax.charge_type),
                                rate: tax.rate,
                                tax_amount: tax.tax_amount,
                                cost_center: tax.cost_center,
								included_in_print_rate: tax.included_in_print_rate,
								row_id: tax.row_id,
                            });
                        });
                        frm.refresh_field("taxes_and_charges");
                    }
                },
                error: function (error) {
                    frappe.msgprint({
                        title: __("Error"),
                        indicator: "red",
                        message: __("Unable to fetch the Sales Taxes and Charges Template."),
                    });
                },
            });
        } else {
            frappe.msgprint({
                title: __("Missing Template"),
                indicator: "orange",
                message: __("Please select a Sales Taxes and Charges Template."),
            });
        }
    },

	before_save:function(frm){
		var row = frm.doc.items;
		total_qty = total_amount = 0;
		row.forEach(data => {
			total_qty += data.qty;
			total_amount += data.amount;
		});
		let tax_total = frm.doc.taxes_and_charges.reduce((sum, tax_row) => {
			return sum + (tax_row.tax_amount || 0);
		}, 0);
		frm.set_value('total_taxes_and_charges', tax_total || 0);
		frm.refresh_field('taxes_and_charges');
		frm.set_value("total_qty", total_qty);
		frm.set_value("total", total_amount);
		frm.set_value("net_total", total_amount);
		frm.set_value("grand_total", total_amount + frm.doc.total_taxes_and_charges);
		frm.set_value("outstanding_amount", total_amount);
		frm.set_value("base_grand_total", total_amount);
		frm.set_value("base_rounding_adjustment", total_amount);
		frm.set_value("base_rounded_total", total_amount);
		if(frm.doc.grand_total > frm.doc.sales_order_grand_total){
			frappe.throw({
				title: __("Overbilling"),
				message: __("The Sum of all Proforma Invoices should be less or equal to Sales Order Grand Total.")
			});
		}
	},
	before_submit: function(frm) {
		// Ensure required fields are present and properly validated
		if (frm.doc.sales_order && frm.doc.sales_order_grand_total && frm.doc.total_amount) {
			if (frm.doc.grand_total > frm.doc.sales_order_grand_total) {
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
	item_code: function(frm, cdt, cdn) {
		const item_data = locals[cdt][cdn];
		fetchItemData(frm, cdt, cdn, item_data.item_code);
	},

	qty: function(frm, cdt, cdn) {
		const item_data = locals[cdt][cdn];
		calculateAndSetAmounts(frm, cdt, cdn, item_data.qty, item_data.rate);
	},
    
	rate: function(frm, cdt, cdn) {
		const item_data = locals[cdt][cdn];
		calculateAndSetAmounts(frm, cdt, cdn, item_data.qty, item_data.rate);
	}
});

frappe.ui.form.on("Sales Taxes and Charges", {

	form_render: function (frm, cdt, cdn) {
		frm.fields_dict['taxes_and_charges'].grid.update_docfield_property(
			'included_in_print_rate', 'hidden', 1
		);
		frappe.model.set_value(cdt, cdn, 'description', "...");
		frm.refresh_field('taxes_and_charges');
	},

	taxes_and_charges_add: function(frm,cdt,cdn){
		frm.fields_dict['taxes_and_charges'].grid.update_docfield_property(
			'included_in_print_rate', 'hidden', 1
		);
		frappe.model.set_value(cdt, cdn, 'description', "...");
		frm.refresh_field('taxes_and_charges');
	},
    charge_type: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.charge_type === "Actual") {
            frm.fields_dict['taxes_and_charges'].grid.update_docfield_property(
                'rate', 'read_only', 1
            );
            frm.fields_dict['taxes_and_charges'].grid.update_docfield_property(
                'tax_amount', 'read_only', 0
            );
        } else if (row.charge_type === "On Net Total" || row.charge_type === "On Item Quantity") {
            frm.fields_dict['taxes_and_charges'].grid.update_docfield_property(
                'tax_amount', 'read_only', 1
            );
            frm.fields_dict['taxes_and_charges'].grid.update_docfield_property(
                'rate', 'read_only', 0
            );
        } else {
            frm.fields_dict['taxes_and_charges'].grid.update_docfield_property(
                'rate', 'read_only', 0
            );
            frm.fields_dict['taxes_and_charges'].grid.update_docfield_property(
                'tax_amount', 'read_only', 0
            );
        }
        frm.refresh_field('taxes_and_charges');
    },
    tax_amount: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (!row) return;
		let previous_row_base_total = 0;
		if (row.idx > 1) {
			let previous_row = frm.doc.taxes_and_charges.find(r => r.idx === row.idx - 1);
			previous_row_base_total = previous_row ? previous_row.base_total || 0 : 0;
		} else {
			previous_row_base_total = frm.doc.net_total || 0;
		}
		let updated_base_total = previous_row_base_total + (row.tax_amount || 0);
		frappe.model.set_value(cdt, cdn, 'base_tax_amount', row.tax_amount || 0);
		frappe.model.set_value(cdt, cdn, 'tax_amount_after_discount_amount', row.tax_amount || 0);
		frappe.model.set_value(cdt, cdn, 'total', updated_base_total || 0);
		frappe.model.set_value(cdt, cdn, 'base_total', updated_base_total || 0);
		let tax_total = frm.doc.taxes_and_charges.reduce((sum, tax_row) => {
			return sum + (tax_row.tax_amount || 0);
		}, 0);
	
		frm.set_value('total_taxes_and_charges', tax_total || 0);
	
		frm.refresh_field('taxes_and_charges');
		frm.refresh_field('total_taxes_and_charges');
	},
	

	rate: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (!row) return;
		let previous_row_base_total = 0;
		if (row.idx > 1) {
			let previous_row = frm.doc.taxes_and_charges.find(r => r.idx === row.idx - 1);
			previous_row_base_total = previous_row ? previous_row.base_total || 0 : 0;
		} else {
			previous_row_base_total = frm.doc.total || 0;
		}
	
		let calculated_value = 0;
		if (row.charge_type === "On Net Total") {
			calculated_value = (row.rate / 100) * frm.doc.total;
		} else if (row.charge_type === "On Item Quantity") {
			calculated_value = (row.rate / 100) * frm.doc.total_qty;
		}
	
		frappe.model.set_value(cdt, cdn, 'base_tax_amount', calculated_value || 0);
		frappe.model.set_value(cdt, cdn, 'tax_amount', calculated_value || 0);
		frappe.model.set_value(cdt, cdn, 'tax_amount_after_discount_amount', calculated_value || 0);
		frappe.model.set_value(cdt, cdn, 'total', total || 0);
		frappe.model.set_value(cdt, cdn, 'base_total', total || 0);
	
		frm.refresh_field('taxes_and_charges');
	},

	row_id: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if(row.row_id == row.idx && row.row_id == 1){
			frappe.throw("Error")
			return 0;
		}
		else{
			if(row.charge_type === "On Previous Row Amount"){
				let data = frm.doc.taxes_and_charges;
				let row_data = data[row.row_id - 1] 
				frappe.model.set_value(cdt, cdn, 'base_tax_amount', (row_data.tax_amount * row.rate)/100 || 0);
				frappe.model.set_value(cdt, cdn, 'tax_amount', (row_data.tax_amount * row.rate)/100 || 0);
				frappe.model.set_value(cdt, cdn, 'tax_amount_after_discount_amount', (row_data.tax_amount * row.rate)/100 || 0);
				frappe.model.set_value(cdt, cdn, 'total', (row_data.tax_amount * row.rate)/100 || 0);
				frappe.model.set_value(cdt, cdn, 'base_total', (row_data.tax_amount * row.rate)/100 || 0);
				let tax_total = frm.doc.taxes_and_charges.reduce((sum, tax_row) => {
					return sum + (tax_row.tax_amount || 0);
				}, 0);
				frm.set_value('total_taxes_and_charges', tax_total || 0);
				frm.refresh_field('taxes_and_charges');
			}
			if(row.charge_type === "On Previous Row Total"){
				let data = frm.doc.taxes_and_charges;
				let row_data = data[row.row_id - 1] 
				frappe.model.set_value(cdt, cdn, 'base_tax_amount', (row_data.base_total * row.rate)/100 || 0);
				frappe.model.set_value(cdt, cdn, 'tax_amount', (row_data.base_total * row.rate)/100 || 0);
				frappe.model.set_value(cdt, cdn, 'tax_amount_after_discount_amount', (row_data.base_total * row.rate)/100 || 0);
				frappe.model.set_value(cdt, cdn, 'total', (row_data.base_total * row.rate)/100 || 0);
				frappe.model.set_value(cdt, cdn, 'base_total', (row_data.base_total * row.rate)/100 || 0);
				let tax_total = frm.doc.taxes_and_charges.reduce((sum, tax_row) => {
					return sum + (tax_row.tax_amount || 0);
				}, 0);
				frm.set_value('total_taxes_and_charges', tax_total || 0);
				frm.refresh_field('taxes_and_charges');
			}
		}
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
				setItemFields(frm, cdt, cdn, result_data);
				setAccountFields(frm, cdt, cdn, result_data);
			} else {
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

async function setAccountFields(frm, cdt, cdn, result_data) {
    if (result_data.item_defaults && result_data.item_defaults.length > 0) {
        for (const data of result_data.item_defaults) {
            if (data.company === frm.doc.company) {
                if (data.income_account || data.expense_account) {
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        'income_account',
                        data.income_account || await getCompanyDefault(frm.doc.company, 'default_income_account')
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        'expense_account',
                        data.expense_account || await getCompanyDefault(frm.doc.company, 'default_expense_account')
                    );
                } else {
                    const accounts = await setDefaultAccounts(frm, cdt, cdn);
                    console.log("Accounts fetched:", accounts);
                }
            }
        }
    }
}


async function setDefaultAccounts(frm, cdt, cdn) {
    try {
        const [expenseResponse, incomeResponse] = await Promise.all([
            frappe.db.get_value("Company", frm.doc.company, "default_expense_account"),
            frappe.db.get_value("Company", frm.doc.company, "default_income_account")
        ]);

        const default_expense_account = expenseResponse.message.default_expense_account;
        const default_income_account = incomeResponse.message.default_income_account;
        // Set the values in the child table
        frappe.model.set_value(cdt, cdn, 'expense_account', default_expense_account);
        frappe.model.set_value(cdt, cdn, 'income_account', default_income_account);

        return {
            default_expense_account,
            default_income_account
        };
    } catch (error) {
        console.error("Error fetching default accounts:", error);
        throw error;
    }
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
					else{
						return null
					}
                });
            }
        }
    });
}

function create_sales_invoice(proforma_invoice) {
    frappe.call({
        method: "envision_sales.public.py.sales_doc_creator.create_sales_invoice",
        args: {
            proforma_invoice: proforma_invoice.name,
        },
        callback: function(response) {
            if (response.message) {
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
                label: 'Payment Amount',
                fieldname: 'payment_amount',
                fieldtype: 'Currency'
            },
            {
                label: 'Work Order',
                fieldname: 'work_order',
                fieldtype: 'Link',
                options: 'Sales Order',
                default: proforma_invoice.sales_order,
				reqd: 1
            },
        ],
        size: 'small', 
        primary_action_label: 'Submit',
        primary_action(values) {
            var amount = values.payment_amount;
            if (amount > proforma_invoice.outstanding_amount) {
                frappe.throw("Payment Amount should be less or equal to Proforma Invoice");
                return 0;  
            }
			else if (amount == 0) {
				frappe.throw("Payment Amount can't be zero");
				return 0;
			}

            d.hide();
            create_payment(proforma_invoice, amount);
        }
    });
    d.show();
}

function create_payment(proforma_invoice, amount) {
    frappe.call({
        method: "envision_sales.public.py.sales_doc_creator.create_payment_entry",
        args: {
            proforma_invoice: proforma_invoice.name,
            sales_order: proforma_invoice.sales_order,
        },
        callback: function(response) {
            if (response.message) {
                frappe.set_route("Form", "Payment Entry", response.message);
            }
        }
    });
	
}
