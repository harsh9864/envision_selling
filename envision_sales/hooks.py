app_name = "envision_sales"
app_title = "Envision Sales"
app_publisher = "Dhruvil Mistry"
app_description = "An app for development of Sales Module for Envision Enviro Tech"
app_email = "dhruvil@sanskartechnolab.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "envision_sales",
# 		"logo": "/assets/envision_sales/logo.png",
# 		"title": "Envision Sales",
# 		"route": "/envision_sales",
# 		"has_permission": "envision_sales.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/envision_sales/css/envision_sales.css"
# app_include_js = "/assets/envision_sales/js/envision_sales.js"

# include js, css files in header of web template
# web_include_css = "/assets/envision_sales/css/envision_sales.css"
# web_include_js = "/assets/envision_sales/js/envision_sales.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "envision_sales/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Sales Order" : "/public/js/sales_order.js",
    "Sales Invoice" : "/public/js/sales_invoice.js",
    }
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "envision_sales/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "envision_sales.utils.jinja_methods",
# 	"filters": "envision_sales.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "envision_sales.install.before_install"
# after_install = "envision_sales.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "envision_sales.uninstall.before_uninstall"
# after_uninstall = "envision_sales.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "envision_sales.utils.before_app_install"
# after_app_install = "envision_sales.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "envision_sales.utils.before_app_uninstall"
# after_app_uninstall = "envision_sales.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "envision_sales.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"envision_sales.tasks.all"
# 	],
# 	"daily": [
# 		"envision_sales.tasks.daily"
# 	],
# 	"hourly": [
# 		"envision_sales.tasks.hourly"
# 	],
# 	"weekly": [
# 		"envision_sales.tasks.weekly"
# 	],
# 	"monthly": [
# 		"envision_sales.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "envision_sales.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "envision_sales.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "envision_sales.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["envision_sales.utils.before_request"]
# after_request = ["envision_sales.utils.after_request"]

# Job Events
# ----------
# before_job = ["envision_sales.utils.before_job"]
# after_job = ["envision_sales.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"envision_sales.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

fixtures = [
    "Custom DocPerm",
    {"dt":"Print Format","filters":[
        [
        "module","in",[
                "envision_sales",
            ]
        ]
    ]}
]