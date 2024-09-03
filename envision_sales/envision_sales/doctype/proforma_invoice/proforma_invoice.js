// Copyright (c) 2024, Dhruvil Mistry and contributors
// For license information, please see license.txt

frappe.ui.form.on("Proforma Invoice", {

    customer:function(frm){
        debit_account = fetchCustomerAccount(frm.doc.customer,frm.doc.company);
        if (debit_account) {
            console.log(debit_account)
            frm.set_value("debit_to", debit_account);
        }
        else{
            frappe.db.get_doc("Company",frm.doc.company).then(doc => {
                console.log("Company's Default Account:", doc.default_receivable_account)
				frm.set_value("debit_to", doc.default_receivable_account);
            });
        }
    },
    
	before_save:function(frm){
		var row = frm.doc.items;
		total_qty = total_amount = 0;
		row.forEach(data => {
			console.log(data)
			total_qty += data.qty;
			total_amount += data.amount;
		})
		console.log("Total_qty",total_qty);
		console.log("Total_amount",total_amount);
		frm.set_value("total_qty",total_qty);
		frm.set_value("total",total_amount);
		frm.set_value("net_total",total_amount);
		frm.set_value("grand_total",total_amount);
		frm.set_value("base_grand_total",total_amount);
		frm.set_value("base_rounding_adjustment",total_amount);
		frm.set_value("base_rounded_total",total_amount);
	},
});

frappe.ui.form.on("Sales Invoice Item", {
	item_code: function(frm, cdt, cdn) {
		const item_data = locals[cdt][cdn];
		frm.fields_dict['items'].grid.update_docfield_property('qty', 'mandatory', 1);
		frm.refresh_field("items");
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