// Copyright (c) 2024, Dhruvil Mistry and contributors
// For license information, please see license.txt

frappe.query_reports["Invoice wise Outstanding"] = {
    "filters": [
        {
            "fieldname": "company",
            "fieldtype": "Link",
            "label": __("Company"),
            "options": "Company",
            "default": frappe.defaults.get_user_default("Company"),
        },
        {
            "fieldname": "from_date",
            "fieldtype": "Date",
            "label": __("From Date"),
            "default": frappe.datetime.add_months(frappe.datetime.get_today(), -1),
        },
        {
            "fieldname": "to_date",
            "fieldtype": "Date",
            "label": __("To Date"),
            "default": frappe.datetime.get_today()
        },
        {
            "fieldname": "voucher_type",
            "fieldtype": "Select",
            "label": __("Voucher Type"),
            "options": "\nSales Order\nProforma Invoice\nSales Invoice\nPayment Entry",
            "default": "\nSales Order\n"
        },
        {
            "fieldname": "id",
            "label": __("ID"),
            "fieldtype": "Link",
            "options": "Sales Order",  // Default option, will be updated dynamically
        },
        {
            "fieldname": "customer",
            "fieldtype": "Link",
            "label": __("Customer"),
            "options": "Customer",
        },
		{
            "fieldname": "aging_type",
            "fieldtype": "Select",
            "label": __("Aging Type"),
            "options": "\nLess than 30\nGreater than 30\nGreater than 60\nGreater than 90\nGreater than 180",
            "default": "Greater than 30"
        },
    ],

    onload: function(report) {
        var voucher_type_filter = frappe.query_report.get_filter("voucher_type");
        var id_filter = frappe.query_report.get_filter("id");

        // Set default value for voucher_type filter when the report loads
        voucher_type_filter.set_value("Sales Order");

        // Add an event listener for changes to the voucher_type filter
        voucher_type_filter.$input.on("change", function() {
            var voucher_type = voucher_type_filter.get_value();
            
            // Update the options of the id filter based on the selected voucher_type
            if (id_filter) {
                // Update the filter options based on voucher_type
                if (voucher_type === "Sales Order") {
                    id_filter.df.options = "Sales Order";
                } else if (voucher_type === "Proforma Invoice") {
                    id_filter.df.options = "Proforma Invoice";
                } else if (voucher_type === "Sales Invoice") {
                    id_filter.df.options = "Sales Invoice";
                } else if (voucher_type === "Payment Entry") {
                    id_filter.df.options = "Payment Entry";
                }else {
                    id_filter.df.options = "";
                }
                id_filter.refresh();  // Refresh the filter to apply the changes
            }

            // Refresh the report to reflect the changes
            frappe.query_report.refresh();
        });
    },

	"formatter": function(value, row, column, data, default_formatter) {
    if(column.fieldname === "Proforma Invoice IDs" || column.fieldname === "Sales Invoice IDs") {
		if (value === "Pending") {
			value = `<span style="color:red;">${value}</span>`;
			return value;
        } else {
            value = default_formatter(value, row, column, data);
			return value;
        }
	}
	
	else {
        // Use the default formatter for other columns
        value = default_formatter(value, row, column, data);
		return value;
    }
    
}

};
