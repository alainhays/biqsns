/** @file biq-widget-element-parser.js
 * @brief Parsing HTML DOM element to get the structure data of widget
 *
 *@author Bayu candra <bayucandra@gmail.com>
 *Creation Year: 2016
*/
function BIQWidgetElementParser($http, $q, Notification){
    var self = this;
    self.$http = $http;
    self.$q = $q;
    self.Notification = Notification;
}
/**
 * Main function to Get values based on widget name by call other functions 
 * 
 * @param {String} p_widget_type is based on widget type wich is belong to html attribute named data-biq-widget-type which need to convert to function name which is using camel case convention ( by using typeToFunction() function)
 * @param {Object} p_widget_sel HTML element got from jQuery function $('#id'). It is selected widget by click 'Edit' after hovering
 * @param {Object} p_structure_sel Selected structure by matching p_widget_sel and defined at biq-widget-structure.js.
 * @returns {Object} generated by function called with self[p_widget_type] which give reference to a function
 */
BIQWidgetElementParser.prototype.getValues = function(p_widget_type, p_widget_sel, p_structure_sel){
    var values = {};
    var self = this;
    var widget_function = self.typeToFunction(p_widget_type);
    values= self[widget_function](p_widget_sel, p_structure_sel);
    return values;
};
/* 
 * 1. Expect JQuery element as parameter i.e: $(element)
 * 2. return var values = { main:{ key: value}, css: {} };
 */
BIQWidgetElementParser.prototype.contactEmailSimple = function( p_el, p_structure_item ){
//    '<a href="mailto:'.$content.'" class="biq-widgets contact-email-simple"'. $css_inline .'>'
//			.'<div class="icon"><img src="'.$icon_value.'"></div>' 
//			.'<div class="text">'. $content .'</div>' 
//		    .'</a>'
    var self = this;
    var values = self.defaultFormValues(p_el);
    
    values["content"] = p_el.children('.text').html();
     
    if( p_el.children('.icon').children('img').length ){
	values['icon_type'] = 'image';
	var image_src = p_el.children('.icon').children('img').attr('src');
	values["icon_value"] = image_src === self.getDefaultValue( p_structure_item, 'icon_value' )? '' : image_src ;
    }else{
	values['icon_type'] = 'css';
	values["icon_value"] = p_el.children('.icon').children('span').attr('class');
    }
    
    return values;
};
BIQWidgetElementParser.prototype.logo = function(p_el, p_structure_item){
    var self = this;
    var values = self.defaultFormValues(p_el);
    
    values['img_title'] = p_el.children('img').attr('title');
    values['img_alt'] = p_el.children('img').attr('alt');
    
    return values;
};
BIQWidgetElementParser.prototype.menuMain = function(p_el, p_structure_item){
    var self = this;
    var values = self.defaultFormValues(p_el);

    values['float'] = p_el.hasClass('right') ? 'right' : 'left';
    
    return values;
};
BIQWidgetElementParser.prototype.headingSectionLeft = function(p_el, p_structure_item){
    var self = this;
    var values = self.defaultFormValues(p_el);
    values["content"] = p_el.html();
    values["tag_name"] = p_el.prop("tagName").toLowerCase();
    if(p_el.hasClass('highlight-default')){
        values['highlight'] = 'highlight-default';
    }else if( p_el.hasClass('highlight-red') ){
        values['highlight'] = 'highlight-red';
    }else{
        values['highlight'] = 'none';
    }
    return values;
};
BIQWidgetElementParser.prototype.categoryList = function(p_el, p_structure_item){
    var self = this;
    var values = self.defaultFormValues(p_el);
    values['taxonomy'] = p_el.data('taxonomy');
    values['orderby'] = p_el.data('orderby');
    values['order'] = p_el.data('order');
    values['hide_empty'] = p_el.data('hideEmpty');
    values['hierarchical'] = p_el.data('hierarchical');
    return values;
};
BIQWidgetElementParser.prototype.slider = function(p_el, p_structure_item){
    var self = this;
    var deferred = self.$q.defer();
    var values = self.defaultFormValues(p_el);
    
    values["no_submit"] = true;
    values["main_attribute"] = p_structure_item.attribute_main[0];

    $b.ajax({
        method:'POST', url:ajaxurl,
        data:{ action:'widget_query', query_type:'slider', widget_id:values.widget_id },
        'success':function(response){//ajaxurl is default by Wordpress
            var response_json = JSON.parse(response);
            values['list'] = response_json.list;
            deferred.resolve(values);
        },
        'error':function(xhr){
            self.Notification('Error server. Status: '+xhr.status,'error');
            deferred.reject(values);
        }
    });

    return deferred.promise;
};
BIQWidgetElementParser.prototype.footerShortDescription = function(p_el, p_structure_item){
    var self = this;
    var values = self.defaultFormValues(p_el);
    values["description_source"] = p_el.data('descriptionSource');
    values["title"] = p_el.children('.biq-title').html();
    values["description"] = p_el.data('description');
    return values;
};
BIQWidgetElementParser.prototype.footerDeveloperInfo = function(p_el, p_structure_item){
    var self = this;
    var values = self.defaultFormValues(p_el);
    values["visible"] = p_el.data('visible')!==true ? 'false' : 'true';
    return values;
};
BIQWidgetElementParser.prototype.postFeed = function(p_el, p_structure_item){
    var self = this;
    var values = self.defaultFormValues(p_el);
    values['post_category'] = p_el.data('postCategory');
    values['limit'] = p_el.data('limit');
    values['clickable'] = p_el.data('clickable').toString();
    values['staggered'] = p_el.data('staggered').toString();
    values['type'] = p_el.data('type');
    values['size'] = p_el.data('size');
    return values;
};
/**
 * Important to get default value of 'key'. Usually necessary when default input can be empty to load based on default value.
 * 
 * @param [Object] p_structure_item structure of widget as defined on file biq-widget-structure.js
 * @param {String} p_key key of input / value type
 * @returns {String} the default value
 */
BIQWidgetElementParser.prototype.getDefaultValue = function(p_structure_item, p_key){
    var ret = '';
    for( var i=0; i<p_structure_item.attribute_main.length; i++){
	if(p_structure_item.attribute_main[i].key === p_key){
	    ret = p_structure_item.attribute_main[i].default;
	}
    }
    for( var i=0; i<p_structure_item.attribute_css.length; i++){
	if(p_structure_item.attribute_css[i].key === p_key){
	    ret = p_structure_item.attribute_css[i].default;
	}
    }
    return ret;
};

BIQWidgetElementParser.prototype.defaultFormValues = function(p_el){
    var self = this;
    var default_values={"widget_id": p_el.data('biqWidgetId'), "widget_type": p_el.data('biqWidgetType'), "css_inline": p_el.attr('style'),
        "classes":self.getClassNames( p_el )};
    return default_values;
};
/**
 * Get class name which belong to attributes only, by remove first 2 classes which is default to be exist ( 'biq-widgets' and a class name of widget )
 * 
 * @param {String} p_class_names is the value of 'class' attribute at HTML element
 * @returns {String} contain class filtered ( 2 default class removed )
 */
BIQWidgetElementParser.prototype.getClassNames = function( p_el ){
    var css_default_arr = typeof p_el.data('biqCssDefault') !=='undefined'?
            $b.trim( p_el.data('biqCssDefault') ).split(' ')
            :[];
    css_default_arr.push('biq-widgets');
    css_default_arr.push('biq-container');
    var css_all_arr = $b.trim( p_el.attr('class') ).split(' ');
    
    return css_all_arr.diff( css_default_arr ).join(' ');
};
//BIQWidgetElementParser.prototype.getClassNames = function( p_class_names ){
//    var ret = "";
//    var class_names_arr = p_class_names.split(' ');
//    class_names_arr.splice(0,2);
//    for(var i=0; i<class_names_arr.length; i++){
//	ret = ret+class_names_arr[i];
//	if(i !== (class_names_arr.length-1) ){
//	    ret = ret+' ';
//	}
//    }
//    return ret;
//};
/*
 * @param {String) p_str is the type name of widget based on convention usualy generated for data-biq-widget-type html attribute
 * @returns {String} Return the string name of function converted from data-biq-widget-type. By converting from underscore separator to camelCase
 */
BIQWidgetElementParser.prototype.typeToFunction = function(p_str){
    var ret = '';
    var type_arr = p_str.split('_');
    for(var i=0; i<type_arr.length; i++){
        var type_component = type_arr[i];
        if(i!==0) type_component = type_component.ucfirst();
        ret = ret + type_component;
    }
    return ret;
};
