//HeaderField.jsx 
import React, { useState } from 'react';
import { Typography, Box, ClickAwayListener, Tooltip, IconButton } from "@mui/material";
import { Menu, HelpOutline, ArrowDropDownSharp, ArrowDropUpSharp, ContentCopy, AddOutlined, RemoveOutlined } from "@mui/icons-material";
import { DATA_TYPES, MODES } from '../constants';
import { Icon } from './Icon';
import PropTypes from 'prop-types';
import classes from './HeaderField.module.css';
import { get } from 'lodash';

const HeaderField = (props) => {
    const [showOptions, setShowOptions] = useState(false);

    // const onClick = (e) => {
    //     setShowOptions(false);
    //     props.onClick(e);
    // }
    const onClick = (e) => {
        setShowOptions(false);
        props.onClick(e);
    }

    const onToggle = (val) => {
        if (val) {
            setShowOptions(val);
        } else {
            setShowOptions((show) => !show);
        }
    }

    const title = props.data.title ? props.data.title : props.name;

    let passToAddActiveContext = false;
    let passToRemoveActiveContext = false;

    if (props.data.mode === MODES.EDIT) {
        const isArrayItem = props.data.xpath && props.data.xpath.endsWith(']');

        if (props.data.type === DATA_TYPES.ARRAY && !props.data['data-remove'] && !props.data.uiUpdateOnly) {
            passToAddActiveContext = true; // Container can "add" new items
            // For removing the whole array, it's usually not a button here, so passToRemoveActiveContext remains false for container itself via this logic
        } else if (props.data.type === DATA_TYPES.OBJECT) {
            if (isArrayItem) {
                // This is an Object that is an Array Item
                passToAddActiveContext = true;   // Allows "Copy" button for child via HeaderOptions' "add" prop
                passToRemoveActiveContext = true; // Allows "Remove" button for child via HeaderOptions' "remove" prop
            } else {
                // This is a standalone/regular Object field that is optional
                if (!props.data.required) {
                    if (props.data['object-add']) { // Indicates it can be added if currently null
                        passToAddActiveContext = true;
                    }
                    if (props.data['object-remove']) { // Indicates it can be removed (set to null)
                        passToRemoveActiveContext = true;
                    }
                }
            }
        }
        // Note: Simple type arrays (array of strings/numbers) add/remove is handled by DATA_TYPES.ARRAY block mostly.
        // Individual primitive items in such arrays don't have their own HeaderField usually.
    }

    let bgColor = 'background.nodeHeader'; // Default
    const dataValue = get(props.updatedDataForColor, props.data.dataxpath);

    if (props.visualState === 'added') {
        bgColor = 'aquamarine'; // Green
    } else if (props.visualState === 'duplicated') {
        bgColor = 'aquamarine'; 
    } else if (props.data['data-remove'] && props.data.xpath.endsWith(']')) {
        // Turn red when array item is marked for deletion
        bgColor = '#ffc7ce'; // Red for deleted array items
    } else if (props.data.type === DATA_TYPES.OBJECT && 
               passToRemoveActiveContext && 
               dataValue === null &&
               get(props.storedDataForColor, props.data.dataxpath) !== null && 
               props.data.mode === MODES.EDIT) {
        bgColor = '#ffc7ce'; // Red for deleted objects
    }

    return (
        <Box className={classes.container} data-xpath={props.data.xpath}>
            <Box className={classes.header} data-xpath={props.data.xpath} bgcolor={bgColor} sx={{color: 'white'}}>
            <span className={classes.icon}>
    {props.isOpen ? (
        <ArrowDropUpSharp 
            fontSize='small' 
            data-close={props.data.xpath} 
            onClick={(e) => {
                e.stopPropagation();  
                props.onClick(e);
            }} 
        />
    ) : (
        <ArrowDropDownSharp 
            data-open={props.data.xpath} 
            onClick={(e) => {
                e.stopPropagation();  
                props.onClick(e);
            }} 
        />
    )}
</span>
                <Typography variant="subtitle1" sx={{ display: 'flex', flex: '1' }} >
                    {title}
                </Typography>
                {
                    props.data.help && (
                        <Tooltip title={props.data.help} disableInteractive>
                            <HelpOutline fontSize='small' />
                        </Tooltip>
                    )
                }
            </Box>

            {/* Pagination Controls */}
            {props.data.pagination && props.data.pagination.totalPages > 1 && (
                <Box 
                    className={`${classes.paginationControls} ${props.data.isContainer ? classes.containerPagination : classes.childPagination}`}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ 
                        display: 'flex',
                        alignItems: 'center', 
                        justifyContent: 'flex-end', 
                        padding: '2px 8px', 
                        borderTop: '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: 'rgba(0,0,0,0.02)'
                    }}
                >
                    <IconButton 
                        size="small" 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            props.data.pagination.onPageChange('prev'); 
                        }} 
                        disabled={props.data.pagination.currentPage === 0}
                        sx={{ padding: '2px' }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>◄</Typography>
                    </IconButton>
                    <Typography variant="caption" sx={{ margin: '0 8px' }}>
                        {props.data.pagination.currentPage + 1}/{props.data.pagination.totalPages} 
                        {!props.data.isContainer && `(${props.data.pagination.totalItems} items)`}
                    </Typography>
                    <IconButton 
                        size="small" 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            props.data.pagination.onPageChange('next'); 
                        }} 
                        disabled={props.data.pagination.currentPage >= props.data.pagination.totalPages - 1}
                        sx={{ padding: '2px' }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>►</Typography>
                    </IconButton>
                </Box>
            )}

            <HeaderOptions
                add={passToAddActiveContext}
                remove={passToRemoveActiveContext}
                show={showOptions}
                metadata={props.data}
                onClick={onClick}
                onToggle={onToggle}
            />
        </Box>
    )
}

HeaderField.propTypes = {
    data: PropTypes.object,
    isOpen: PropTypes.bool,
    onClick: PropTypes.func,
    updatedDataForColor: PropTypes.object, // To get current value for red color logic
    storedDataForColor: PropTypes.object,   // To compare for red color logic
    visualState: PropTypes.string // Added prop type for visualState
};

const HeaderOptions = ({ add, remove, show, metadata, onClick, onToggle }) => {
    const { xpath, ref } = metadata;

    // Helper to check if xpath points to an array item (child)
    const isChild = xpath.endsWith(']');

    // Determine button visibility based on your rules
    const showAdd = add && !isChild;           // add only on container
    const showCopy = add && isChild && !metadata['data-remove'];           // duplicate only on child and hide if already marked for deletion
    const showRemove = remove && isChild; 

    if (showAdd || showCopy || showRemove) {
        if (show) {
            return (
                <ClickAwayListener onClickAway={() => onToggle(false)}>
                    <Box className={classes.menu} bgcolor='background.secondary'>
                        {showAdd && (
                            <IconButton
                                size='small'
                                title='Add'
                                data-add={xpath}
                                data-ref={ref}
                                data-prop={JSON.stringify(metadata)}
                                onClick={(e) => { e.stopPropagation(); onClick(e); }}>
                                <AddOutlined fontSize='small' />
                            </IconButton>
                        )}
                        {showCopy && (
                            <IconButton
                                size='small'
                                title='Duplicate'
                                data-duplicate={xpath}
                                data-ref={ref}
                                data-prop={JSON.stringify(metadata)}
                                onClick={(e) => { e.stopPropagation(); onClick(e); }}>
                                <ContentCopy fontSize='small' />
                            </IconButton>
                        )}
                        {showRemove && (
                            <IconButton
                                size='small'
                                title='Remove'
                                data-remove={xpath}
                                onClick={(e) => { e.stopPropagation(); onClick(e); }}>
                                <RemoveOutlined fontSize='small' />
                            </IconButton>
                        )}
                    </Box>
                </ClickAwayListener>
            );
        } else {
            return (
                <Box className={classes.option} bgcolor='background.secondary'>
                    <Icon title="More Options" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                        <Menu />
                    </Icon>
                </Box>
            );
        }
    }

    return null; // No buttons to show
};

export default HeaderField;


//treeHelper.js
import { cloneDeep, get } from 'lodash';
import { MODES, DATA_TYPES ,ITEMS_PER_PAGE} from '../constants';
import {
    getEnumValues, getModelSchema, hasxpath, setAutocompleteValue, primitiveDataTypes, getDataxpath,
    isNodeInSubtree, complexFieldProps, treeState, fieldProps, getAutocompleteDict, getMetaFieldDict, 
    getMappingSrcDict, compareNodes
} from '../utils';

export function generateTreeStructure(schema, currentSchemaName, callerProps) {
    if (!schema || Object.keys(schema).length === 0) return [];

    const currentSchema = getModelSchema(currentSchemaName, schema);
    const tree = [];
    
    // Add root header node
    const childNode = addHeaderNode(tree, currentSchema, currentSchemaName, DATA_TYPES.OBJECT, callerProps, currentSchemaName, currentSchemaName);
    
    // Process all properties
    Object.keys(currentSchema.properties).forEach(propname => {
        if (callerProps.xpath && callerProps.xpath !== propname) return;
        
        const metadataProp = currentSchema.properties[propname];
        metadataProp.required = currentSchema.required.includes(propname) ? metadataProp.required : [];
        
        if (metadataProp.type && primitiveDataTypes.includes(metadataProp.type)) {
            addSimpleNode(childNode, schema, currentSchema, propname, callerProps);
        } else {
            addNode(childNode, schema, metadataProp, propname, callerProps, propname, null, propname);
        }
    });

    return tree;
}

function addNode(tree, schema, currentSchema, propname, callerProps, dataxpath, type, xpath) {
    const { data, originalData, mode } = callerProps;
    const currentSchemaType = type || currentSchema.type;

    // Handle object type with items
    if (currentSchema.items && currentSchemaType === DATA_TYPES.OBJECT) {
        handleObjectWithItems(tree, schema, currentSchema, propname, callerProps, dataxpath, xpath);
    } 
    // Handle array type with items
    else if (currentSchema.items && currentSchema.type === DATA_TYPES.ARRAY) {
        handleArrayWithItems(tree, schema, currentSchema, propname, callerProps, dataxpath, xpath);
    } 
    // Handle simple array type
    else if (currentSchema.type === DATA_TYPES.ARRAY) {
        handleSimpleArray(tree, schema, currentSchema, propname, callerProps, dataxpath, xpath);
    }
}

function handleObjectWithItems(tree, schema, currentSchema, propname, callerProps, dataxpath, xpath) {
    // const { data, originalData, mode } = callerProps; // These are now unused due to direct callerProps access

    //If there's no data for this object in either the current data or original data, it does nothing.
    
    if (get(callerProps.data, dataxpath) === undefined && get(callerProps.originalData, xpath) === undefined) return;
    
    const headerState = determineHeaderState(callerProps.data, callerProps.originalData, xpath, currentSchema);
    
    if (callerProps.mode === MODES.EDIT && currentSchema.server_populate) return;
    
    // Resolve the actual schema for the item if currentSchema is an array definition with items.$ref
    let schemaForHeaderNode = currentSchema;
    let itemRefForHeaderNode = currentSchema.items?.$ref; // Use array's items ref if available
    let effectivePropName = propname; // Usually the array name

    if (currentSchema.type === DATA_TYPES.ARRAY && currentSchema.items && currentSchema.items.$ref) {
        // This happens when handleObjectWithItems is called for an item of an array
        // currentSchema is the array's schema. propname is the array's name.
        // We want the header for the *item* to use the item's schema for its title.
        const ref = currentSchema.items.$ref.split('/');
        schemaForHeaderNode = ref.length === 2 ? cloneDeep(schema[ref[1]]) : cloneDeep(schema[ref[1]][ref[2]]);
        // Process/inherit relevant properties from array schema to item schema if necessary
        // For example, 'orm_no_update' might be on the array but apply to items.
        // The existing processMetadata call later might handle this, or we might need a specific merge here.
        // For now, primarily focusing on getting the title right.
        // We keep propname as the array's name for keying, title will come from schemaForHeaderNode.title

        // Let's ensure schemaForHeaderNode has necessary top-level fields if they were on currentSchema (array)
        // like 'required' status for the object itself, if applicable (though items in array are usually not "required" individually in same way)
         if (currentSchema.required) { // If array schema had 'required' array
            schemaForHeaderNode.required = schemaForHeaderNode.required || []; // Initialize if not present on item schema
         }
         // Copy other relevant top-level attributes from array schema to item schema if they make sense
         const arrayLevelPropsToConsider = ['orm_no_update', 'server_populate', 'ui_update_only', 'help'];
         arrayLevelPropsToConsider.forEach(p => {
             if (currentSchema.hasOwnProperty(p) && !schemaForHeaderNode.hasOwnProperty(p)) {
                 schemaForHeaderNode[p] = currentSchema[p];
             }
         });


    } else if (currentSchema.items && currentSchema.type === DATA_TYPES.OBJECT && currentSchema.items.$ref) {
        // This is for an object that itself has items (like a map/dictionary an object with $ref items)
        // The header for this object itself should use currentSchema.
        // The ref for its children will be currentSchema.items.$ref
        itemRefForHeaderNode = currentSchema.items.$ref;
    }


    const childNode = addHeaderNode(
        tree, 
        schemaForHeaderNode, // Use potentially overridden schema (item schema for array items)
        effectivePropName,   // Usually the original propname (array name or object field name)
        DATA_TYPES.OBJECT, // The type of the node being added (the item is an object)
        callerProps, 
        dataxpath, 
        xpath, 
        itemRefForHeaderNode, // Pass the ref for the item's type, or object's items
        headerState
    );

    if (get(callerProps.data, dataxpath) === null && (!get(callerProps.originalData, xpath) || get(callerProps.originalData, xpath) === null)) return;

    // Metadata for properties *within* this object/item
    let metadata;
    if (schemaForHeaderNode.properties) { // If the item schema itself has properties directly
        metadata = processMetadata(cloneDeep(schemaForHeaderNode), currentSchema); // Process with original array schema for context
    } else if (currentSchema.items && currentSchema.items.$ref) { // Fallback to array's item ref if item schema itself didn't have props (e.g. direct $ref)
        const ref = currentSchema.items.$ref.split('/');
        metadata = ref.length === 2 ? schema[ref[1]] : schema[ref[1]][ref[2]];
        metadata = processMetadata(cloneDeep(metadata), currentSchema); // currentSchema is the array schema
    } else {
        // Should not happen if items.$ref was present
        return;
    }


    if (metadata.properties) {
        processMetadataProperties(metadata, childNode, schema, callerProps, dataxpath, xpath);
    }
}

function handleArrayWithItems(tree, schema, currentSchema, propname, callerProps, dataxpath, xpath) {
    if (callerProps.mode === MODES.EDIT && currentSchema.server_populate) return;

    const { data, originalData } = callerProps;
    const hasEmptyData = isEmptyArrayData(data, originalData, dataxpath, xpath);

    // Create a container node for the array
    const containerNode = addHeaderNode(
        tree, 
        currentSchema, 
        propname, 
        DATA_TYPES.ARRAY, // Type as object for the container
        callerProps, 
        dataxpath, 
        xpath, 
        currentSchema.items?.$ref,
       
    );

    if (hasEmptyData) {
        const childxpath = `${dataxpath}[-1]`;
        const updatedxpath = `${xpath}[-1]`;
        addHeaderNode(containerNode, currentSchema, propname, currentSchema.type, callerProps, childxpath, updatedxpath, currentSchema.items.$ref);
        return;
    }

    // Call processArrayItems with the container node instead of the tree
    processArrayItems(containerNode, schema, currentSchema, propname, callerProps, dataxpath, xpath);
}

function handleSimpleArray(tree, schema, currentSchema, propname, callerProps, dataxpath, xpath) {
    if ((get(callerProps.originalData, xpath) === undefined) && get(callerProps.data, dataxpath) === undefined) return;

    const arrayDataType = getArrayDataType(currentSchema);
    const additionalProps = buildArrayAdditionalProps(schema, currentSchema);
    
    // Create container node first
    const containerNode = addHeaderNode(
        tree, 
        currentSchema, 
        propname, 
        DATA_TYPES.ARRAY, // Type as object for the container
        callerProps, 
        dataxpath, 
        xpath, 
        currentSchema.items?.$ref,
    );
    
    const childxpath = `${dataxpath}[-1]`;
    const updatedxpath = `${xpath}[-1]`;
    const objectState = { add: true, remove: false };
    
    const childNode = addHeaderNode(
        containerNode, // Add to container node instead of tree
        currentSchema, 
        propname, 
        currentSchema.type, 
        callerProps, 
        childxpath, 
        updatedxpath, 
        arrayDataType, 
        objectState
    );

    if (get(callerProps.data, dataxpath)) {
        const items = get(callerProps.data, dataxpath);
        const totalItems = items.length;
        const needsPagination = totalItems > ITEMS_PER_PAGE;
        
        if (needsPagination) {
            // Add pagination info to the parent node
            containerNode[containerNode.length - 1].pagination = {
                totalItems,
                totalPages: Math.ceil(totalItems / ITEMS_PER_PAGE),
                currentPage: 0,
                paginationId: `pagination_${xpath}`
            };
            
            // Create pagination controls
            const paginationNode = {
                id: containerNode[containerNode.length - 1].pagination.paginationId,
                key: 'pagination',
                name: `Page 1 of ${containerNode[containerNode.length - 1].pagination.totalPages}`,
                isPagination: true,
                xpath: `${xpath}_pagination`,
                prevPage: 0, // Initially disabled
                nextPage: 1,
                onPageChange: true // Flag to handle pagination in the component
            };
            
            // Add the pagination node
            containerNode.push(paginationNode);
            
            // Only process items for the first page
            const startIndex = 0;
            const endIndex = Math.min(ITEMS_PER_PAGE, totalItems);
            
            for (let i = startIndex; i < endIndex; i++) {
                const itemXpath = `${dataxpath}[${i}]`;
                const updatedItemXpath = `${xpath}[${i}]`;
                addSimpleNode(childNode, schema, arrayDataType, null, callerProps, itemXpath, updatedItemXpath, additionalProps);
            }
        } else {
            // If pagination not needed, process all items
            items.forEach((value, i) => {
                const itemXpath = `${dataxpath}[${i}]`;
                const updatedItemXpath = `${xpath}[${i}]`;
                addSimpleNode(childNode, schema, arrayDataType, null, callerProps, itemXpath, updatedItemXpath, additionalProps);
            });
        }
    }
}

function addHeaderNode(node, currentSchema, propname, type, callerProps, dataxpath, xpath, ref, objectState) {
    const headerNode = {
        id: Math.random(),
        key: propname,
        title: currentSchema.title,
        name: propname,
        type,
        ref,
        help: currentSchema.help,
        mode: callerProps.mode,
        xpath,
        dataxpath,
        children: []
    };

    // Add field properties
    fieldProps.forEach(({ propertyName, usageName }) => {
        if (currentSchema[propertyName]) {
            headerNode[usageName] = currentSchema[propertyName];
        }
    });

    // Add complex field properties
    complexFieldProps.forEach(({ propertyName, usageName }) => {
        if (currentSchema[propertyName]) {
            headerNode[usageName] = currentSchema[propertyName];
        }
    });

    // Check if this node represents an array container
    if (type === DATA_TYPES.ARRAY) {
        // We can refine this condition if needed, e.g., by checking if currentSchema.items exist
        // For now, if it's explicitly typed as ARRAY in addHeaderNode, we mark it as a container.
        // This is particularly true for nodes created by handleArrayWithItems and handleSimpleArray
        // as the *container* node.
        headerNode.isContainer = true;
    }

    headerNode.required = !ref ? true : currentSchema.required ? currentSchema.required.includes(propname) : true;
    headerNode.uiUpdateOnly = currentSchema.ui_update_only;

    if (!dataxpath) {
        headerNode['data-remove'] = true;
    }

    if (objectState) {
        const { add, remove } = objectState;
        if (add) headerNode['object-add'] = true;
        if (remove) headerNode['object-remove'] = true;
    }

    // Handle tree state
    if (treeState.hasOwnProperty(xpath)) {
        treeState[xpath] = callerProps.isOpen ? true : callerProps.isOpen === false ? false : treeState[xpath];
    } else {
        treeState[xpath] = true;
    }
    headerNode.isOpen = treeState[xpath];

    node.push(headerNode);
    return headerNode.children;
}

function addSimpleNode(tree, schema, currentSchema, propname, callerProps, dataxpath, xpath, additionalProps = {}) {
    const { data, originalData /*, mode*/ } = callerProps; // mode is unused, callerProps.mode is used

    // Skip if data not present in both modified and original data
    if ((Object.keys(data).length === 0 && Object.keys(originalData).length === 0) || 
        (dataxpath && get(data, dataxpath) === undefined && get(originalData, xpath) === undefined)) {
        return;
    }

    if (primitiveDataTypes.includes(currentSchema)) {
        addPrimitiveNode(tree, currentSchema, dataxpath, xpath, callerProps, additionalProps);
        return;
    }

    const attributes = currentSchema.properties[propname];
    if (!attributes?.type || !primitiveDataTypes.includes(attributes.type)) return;

    const node = createSimpleNode(attributes, propname, dataxpath, xpath, data, currentSchema, callerProps);
    
    // Add field properties
    addNodeProperties(node, attributes, currentSchema, schema, data, callerProps);

    // Compare with original data
    const comparedProps = compareNodes(originalData, data, dataxpath, propname, xpath);
    Object.assign(node, comparedProps);

    // Check if node should be added
    if (!shouldAddNode(node, callerProps)) return;

    tree.push(node);
}

// Helper functions for addSimpleNode
function addPrimitiveNode(tree, type, dataxpath, xpath, callerProps, additionalProps) {
    const node = {
        id: dataxpath,
        required: true,
        xpath,
        dataxpath,
        onTextChange: callerProps.onTextChange,
        onFormUpdate: callerProps.onFormUpdate,
        mode: callerProps.mode,
        showDataType: callerProps.showDataType,
        type,
        underlyingtype: additionalProps.underlyingtype,
        value: dataxpath ? get(callerProps.data, dataxpath) : undefined
    };

    if (type === DATA_TYPES.ENUM) {
            node.dropdowndataset = additionalProps.options;
            node.onSelectItemChange = callerProps.onSelectItemChange;
        }

        tree.push(node);
}

function createSimpleNode(attributes, propname, dataxpath, xpath, data, currentSchema, callerProps) {
    return {
        id: propname,
        key: propname,
        required: currentSchema.required.includes(propname),
        xpath: xpath ? `${xpath}.${propname}` : propname,
        dataxpath: dataxpath ? `${dataxpath}.${propname}` : propname,
        parentcollection: currentSchema.title,
        onTextChange: callerProps.onTextChange,
        onFormUpdate: callerProps.onFormUpdate,
        mode: callerProps.mode,
        showDataType: callerProps.showDataType,
        index: callerProps.index,
        forceUpdate: callerProps.forceUpdate,
        value: dataxpath ? 
            hasxpath(data, dataxpath) ? 
                get(data, dataxpath)[propname] : 
                undefined : 
            data[propname]
    };
}

function shouldAddNode(node, callerProps) {
    if ((node.serverPopulate && callerProps.mode === MODES.EDIT) || 
        (node.hide && callerProps.hide) || 
        (node.uiUpdateOnly && node.value === undefined)) {
        return false;
    }

    if (node.type === DATA_TYPES.BOOLEAN && node.button && callerProps.mode === MODES.EDIT) {
        return false;
    }

    return true;
}

function addNodeProperties(node, attributes, currentSchema, schema, data, callerProps) {
    // Add regular field properties
    fieldProps.forEach(({ propertyName, usageName }) => {
        if (attributes.hasOwnProperty(propertyName)) {
            node[usageName] = attributes[propertyName];
        }
    });

    // Add complex field properties
    complexFieldProps.forEach(({ propertyName, usageName }) => {
            if (currentSchema.hasOwnProperty(propertyName) || attributes.hasOwnProperty(propertyName)) {
            const propertyValue = attributes[propertyName] || currentSchema[propertyName];

                if (propertyName === 'auto_complete') {
                const autocompleteDict = getAutocompleteDict(propertyValue);
                setAutocompleteValue(schema, node, autocompleteDict, node.key, usageName);
                
                if (node.options) {
                        if (node.hasOwnProperty('dynamic_autocomplete')) {
                            const dynamicValuePath = node.autocomplete.substring(node.autocomplete.indexOf('.') + 1);
                            const dynamicValue = get(data, dynamicValuePath);
                            if (dynamicValue && schema.autocomplete.hasOwnProperty(dynamicValue)) {
                                node.options = schema.autocomplete[schema.autocomplete[dynamicValue]];
                                if (!node.options.includes(node.value) && callerProps.mode === MODES.EDIT && !node.ormNoUpdate && !node.serverPopulate) {
                                    node.value = null;
                                }
                            }
                        }
                        node.customComponentType = 'autocomplete';
                        node.onAutocompleteOptionChange = callerProps.onAutocompleteOptionChange;
                    }
            } else if (propertyName === 'mapping_underlying_meta_field') {
                const dict = getMetaFieldDict(propertyValue);
                for (const field in dict) {
                    if (node.xpath.endsWith(field)) {
                        node[usageName] = dict[field];
                    }
                }
            } else if (propertyName === 'mapping_src') {
                const dict = getMappingSrcDict(propertyValue);
                    for (const field in dict) {
                        if (node.xpath.endsWith(field)) {
                            node[usageName] = dict[field];
                        }
                    }
            } else {
                    node[usageName] = propertyValue;
                }
            }
    });

    // Add type-specific handlers
    if (attributes.type === DATA_TYPES.BOOLEAN) {
        node.onCheckboxChange = callerProps.onCheckboxChange;
    }

    if (attributes.type === DATA_TYPES.ENUM) {
        node.onSelectItemChange = callerProps.onSelectItemChange;
        // Set dropdown options for enum fields
        if (attributes.enum) {
            node.dropdowndataset = attributes.enum;
        } else if (attributes.$ref) {
            const ref = attributes.$ref.split('/');
            node.dropdowndataset = getEnumValues(schema, ref, DATA_TYPES.ENUM);
        } else if (attributes.items && attributes.items.$ref) {
            // Handle enum references inside items
            const ref = attributes.items.$ref.split('/');
            node.dropdowndataset = getEnumValues(schema, ref, DATA_TYPES.ENUM);
        }
    }

    if (attributes.type === DATA_TYPES.DATE_TIME) {
        node.onDateTimeChange = callerProps.onDateTimeChange;
    }
}

function determineHeaderState(data, originalData, xpath, currentSchema) {
    let headerState = {};
    if (get(originalData, xpath) === undefined) {
        if (get(data, xpath) === null) {
            headerState.add = true;
            headerState.remove = false;
        } else {
            headerState.add = false;
            headerState.remove = true;
        }
    } else if (currentSchema.hasOwnProperty('orm_no_update')) {
        if (get(originalData, xpath) !== undefined) {
            headerState.add = false;
            headerState.remove = false;
        }
    } else if (!currentSchema.hasOwnProperty('orm_no_update')) {
        if (get(data, xpath) === null) {
            headerState.add = true;
            headerState.remove = false;
        } else {
            headerState.add = false;
            headerState.remove = true;
        }
    }
    return headerState;
}

function processMetadata(metadata, currentSchema) {
    const propertiesToCopy = ['orm_no_update', 'server_populate', 'ui_update_only', 'auto_complete'];
    
    propertiesToCopy.forEach(prop => {
        if (currentSchema.hasOwnProperty(prop) || metadata.hasOwnProperty(prop)) {
            metadata[prop] = metadata[prop] || currentSchema[prop];
        }
    });

    return metadata;
}

function processMetadataProperties(metadata, childNode, schema, callerProps, dataxpath, xpath) {
    Object.keys(metadata.properties).forEach((prop) => {
        let metadataProp = metadata.properties[prop];
        if (!metadata.required.includes(prop)) {
            metadataProp.required = [];
        }

        const propertiesToInherit = ['ui_update_only', 'server_populate', 'orm_no_update', 'auto_complete'];
        propertiesToInherit.forEach(property => {
            if (metadata.hasOwnProperty(property)) {
                metadataProp[property] = metadataProp[property] ?? metadata[property];
            }
        });

        const childxpath = dataxpath ? `${dataxpath}.${prop}` : prop;
        const updatedxpath = `${xpath}.${prop}`;

        if (metadataProp.type === DATA_TYPES.OBJECT) {
            addNode(childNode, schema, metadataProp, prop, callerProps, childxpath, null, updatedxpath);
        } else if (primitiveDataTypes.includes(metadataProp.type)) {
            addSimpleNode(childNode, schema, metadata, prop, callerProps, dataxpath, xpath);
        } else {
            addNode(childNode, schema, metadataProp, prop, callerProps, childxpath, null, updatedxpath);
        }
    });
}

function isEmptyArrayData(data, originalData, dataxpath, xpath) {
    return ((get(data, dataxpath) && get(data, dataxpath).length === 0) || 
            (Object.keys(data).length > 0 && !get(data, dataxpath))) &&
           ((get(originalData, xpath) && get(originalData, xpath).length === 0) || 
            !get(originalData, xpath));
}

function processArrayItems(tree, schema, currentSchema, propname, callerProps, dataxpath, xpath) {
    const paths = [];
    const { data, originalData } = callerProps;
    
    // First, collect all items that need to be processed
    const itemsToProcess = [];
    
    // Process original data items
    if (get(originalData, xpath)) {
        for (let i = 0; i < get(originalData, xpath).length; i++) {
            const updatedxpath = `${xpath}[${i}]`;
            let childxpath = `${dataxpath}[${i}]`;
            childxpath = getDataxpath(data, updatedxpath);
            paths.push(updatedxpath);
            
            if (!isNodeInSubtree(callerProps, xpath, updatedxpath)) continue;
            
            itemsToProcess.push({
                index: i,
                childxpath,
                updatedxpath,
                fromOriginal: true
            });
        }
    }

    // Process modified data items
    if (get(data, dataxpath)) {
        get(data, dataxpath).forEach((childobject, i) => {
            const subpropname = Object.keys(childobject).find(key => key.startsWith('xpath_'));
            if (!subpropname) return;
            
            const propxpath = childobject[subpropname];
            const propindex = propxpath.substring(propxpath.lastIndexOf('[') + 1, propxpath.lastIndexOf(']'));
            const updatedxpath = `${xpath}[${propindex}]`;
            
            if (paths.includes(updatedxpath)) return;
            
            const childxpath = `${dataxpath}[${i}]`;
            if (!isNodeInSubtree(callerProps, xpath, updatedxpath)) return;
            
            itemsToProcess.push({
                index: i,
                childxpath,
                updatedxpath,
                fromOriginal: false
            });
            paths.push(childxpath);
        });
    }
    
    // Add pagination information to the parent node
    const totalItems = itemsToProcess.length;
    const needsPagination = totalItems > ITEMS_PER_PAGE;
    
    // If we need pagination, create pagination controls
    if (needsPagination) {
        // Find the parent node (assuming it's the last one added to tree)
        let parentNode = null;
        for (let i = tree.length - 1; i >= 0; i--) {
            if (tree[i].xpath === xpath) {
                parentNode = tree[i];
                break;
            }
        }
        
        if (parentNode) {
            // Add pagination info to the parent node
            parentNode.pagination = {
                totalItems,
                totalPages: Math.ceil(totalItems / ITEMS_PER_PAGE),
                currentPage: 0,
                paginationId: `pagination_${xpath}`
            };
            
            // Create pagination controls
            const paginationNode = {
                id: parentNode.pagination.paginationId,
                key: 'pagination',
                name: `Page 1 of ${parentNode.pagination.totalPages}`,
                isPagination: true,
                xpath: `${xpath}_pagination`,
                prevPage: 0, // Initially disabled
                nextPage: 1,
                onPageChange: true // Flag to handle pagination in the component
            };
            
            // Add the pagination node to the tree
            tree.push(paginationNode);
            
            // Only process items for the current page (first page)
            const startIndex = 0;
            const endIndex = Math.min(ITEMS_PER_PAGE, totalItems);
            itemsToProcess.slice(startIndex, endIndex).forEach(item => {
                addNode(tree, schema, currentSchema, propname, callerProps, item.childxpath, DATA_TYPES.OBJECT, item.updatedxpath);
            });
        } else {
            // If no parent node found, process all items (fallback)
            itemsToProcess.forEach(item => {
                addNode(tree, schema, currentSchema, propname, callerProps, item.childxpath, DATA_TYPES.OBJECT, item.updatedxpath);
            });
        }
    } else {
        // If we don't need pagination, process all items
        itemsToProcess.forEach(item => {
            addNode(tree, schema, currentSchema, propname, callerProps, item.childxpath, DATA_TYPES.OBJECT, item.updatedxpath);
        });
    }
}

function getArrayDataType(currentSchema) {
    let arrayDataType = currentSchema.underlying_type;
    if ([DATA_TYPES.INT32, DATA_TYPES.INT64, DATA_TYPES.INTEGER, DATA_TYPES.FLOAT].includes(arrayDataType)) {
        arrayDataType = DATA_TYPES.NUMBER;
    }
    return arrayDataType;
}

function buildArrayAdditionalProps(schema, currentSchema) {
    const additionalProps = {
        underlyingtype: currentSchema.underlying_type
    };
    
    if (currentSchema.underlying_type === DATA_TYPES.ENUM) {
        const ref = currentSchema.items.$ref;
        const refSplit = ref.split('/');
        const metadata = refSplit.length === 2 ? schema[refSplit[1]] : schema[refSplit[1]][refSplit[2]];
        additionalProps.options = metadata.enum;
    }
    
    return additionalProps;
}


//dataTre.jsx 

//with fixed last page issue 

import React, { useState, useEffect, useCallback } from 'react';
import TreeView from 'react-accessible-treeview';
import { cloneDeep, get, set } from 'lodash';
import { generateObjectFromSchema, addxpath, getDataxpath, setTreeState, clearxpath, clearId } from '../../../utils';
import { DATA_TYPES, ITEMS_PER_PAGE} from '../../../constants';
import { generateTreeStructure } from '../../../utils/treeHelper';
import Node from '../../Node';
import HeaderField from '../../HeaderField';


const DataTree = ({
    projectSchema,
    modelName,
    updatedData,
    storedData,
    subtree,
    mode,
    xpath,
    onUpdate,
    onUserChange,
    selectedId,
    showHidden
}) => {
    const [treeData, setTreeData] = useState([]);
    const [originalTree, setOriginalTree] = useState([]);
    // Track pagination state for nodes with many children
    const [paginatedNodes, setPaginatedNodes] = useState({});
    const [itemVisualStates, setItemVisualStates] = useState({}); // Added state for visual cues

    // Handle page change for a paginated node
    const handlePageChange = useCallback((nodeId, direction) => {
        setPaginatedNodes(prev => {
            const nodeState = prev[nodeId] || { page: 0, totalPages: 1 };
            let newPage = nodeState.page;
            
            if (direction === 'next') {
                newPage = Math.min(newPage + 1, nodeState.totalPages - 1);
            } else if (direction === 'prev') {
                newPage = Math.max(newPage - 1, 0);
            }
            
            return {
                ...prev,
                [nodeId]: {
                    ...nodeState,
                    page: newPage
                }
            };
        });
    }, []);

    // Define these handlers that useEffect depends on, ensuring they are stable or included in deps
    const handleTextChange = useCallback((e, type, xpath, value, dataxpath, validationRes) => {
        if (value === '') {
            value = null;
        }
        if (type === DATA_TYPES.NUMBER) {
            if (value !== null) {
                value = Number(value);
            }
        }
        if (type === DATA_TYPES.STRING || (type === DATA_TYPES.NUMBER && !isNaN(value))) {
            handleFormUpdate(xpath, dataxpath, value, validationRes);
        }
    }, [onUpdate, onUserChange]); // Added dependencies assuming handleFormUpdate is stable or defined outside/above

    const handleDateTimeChange = useCallback((dataxpath, xpath, value) => {
        handleFormUpdate(xpath, dataxpath, value);
    }, [onUpdate, onUserChange]); // Added dependencies

    const handleSelectItemChange = useCallback((e, dataxpath, xpath) => {
        const value = e.target.value;
        handleFormUpdate(xpath, dataxpath, value);
    }, [onUpdate, onUserChange]); // Added dependencies

    const handleCheckboxToggle = useCallback((e, dataxpath, xpath) => {
        const value = e.target.checked;
        handleFormUpdate(xpath, dataxpath, value);
    }, [onUpdate, onUserChange]); // Added dependencies

    const handleAutocompleteChange = useCallback((e, value, dataxpath, xpath) => {
        handleFormUpdate(xpath, dataxpath, value);
    }, [onUpdate, onUserChange]); // Added dependencies

    useEffect(() => {
        const generatedTree = generateTreeStructure(cloneDeep(projectSchema), modelName, {
            'data': updatedData,
            'isOpen': true,
            'hide': !showHidden ?? false,
            'showDataType': false,
            'originalData': storedData,
            'subtree': subtree,
            'mode': mode,
            'xpath': xpath,
            'onTextChange': handleTextChange,
            'onSelectItemChange': handleSelectItemChange,
            'onCheckboxChange': handleCheckboxToggle,
            'onAutocompleteOptionChange': handleAutocompleteChange,
            'onDateTimeChange': handleDateTimeChange,
            'index': selectedId,
            'forceUpdate': false,
        });
        console.log("generated tree is : ", generatedTree);
        console.log("original tree is : ", originalTree);

        setOriginalTree(generatedTree);

        // Create a flat array for all nodes
        const flattenedNodes = [];
        const xpathToIdMap = new Map();
        
        // Add root node with special ID
        const rootId = "root";
        flattenedNodes.push({
            name: modelName,
            children: [],
            id: rootId,
            parent: null,
            metadata: null
        });

        // Recursive function to process nodes
        
        const processNode = (node, parentId) => {
            // Use xpath as ID, but ensure it's a string and handle null/undefined
            const currentId = node.xpath || String(Math.random());
            xpathToIdMap.set(currentId, node);
            
            const treeNode = {
                name: node.name || node.key || "",
                children: [],
                id: currentId,
                parent: parentId,
                metadata: node
            };

            flattenedNodes.push(treeNode);
            

            // Check if this node has many children that should be paginated
            if (node.children && node.children.length > ITEMS_PER_PAGE) {
                // Initialize pagination state for this node if not already set
                setPaginatedNodes(prev => {
                    if (!prev[currentId]) {
                        const totalPages = Math.ceil(node.children.length / ITEMS_PER_PAGE);
                        return {
                            ...prev,
                            [currentId]: {
                                page: 0,
                                totalPages,
                                totalItems: node.children.length
                            }
                        };
                    }
                    return prev;
                });
                
                // Process only the children for the current page
                const pageIndex = paginatedNodes[currentId]?.page || 0;
                const startIndex = pageIndex * ITEMS_PER_PAGE;
                const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, node.children.length);
                
                const visibleChildren = node.children.slice(startIndex, endIndex);
                
                visibleChildren.forEach(childNode => {
                    const childId = processNode(childNode, currentId);
                    treeNode.children.push(childId);
                });
                
                // Add pagination info to the node's metadata
                if (treeNode.metadata) {
                    treeNode.metadata.pagination = {
                        currentPage: pageIndex,
                        totalPages: Math.ceil(node.children.length / ITEMS_PER_PAGE),
                        totalItems: node.children.length,
                        onPageChange: (direction) => handlePageChange(currentId, direction)
                    };
                }
            } else if (node.children && node.children.length > 0) {
                // For nodes with fewer children, process all of them
                node.children.forEach(childNode => {
                    const childId = processNode(childNode, currentId);
                    treeNode.children.push(childId);
                });
            }

            return currentId;
        };
        
        // Process all top-level nodes
        generatedTree.forEach(node => {
            const nodeId = processNode(node, rootId);
            flattenedNodes[0].children.push(nodeId);
        });
        
        setTreeData(flattenedNodes);
        console.log("tree data after flattening is : ", treeData);
    }, [projectSchema, storedData, updatedData, mode, subtree, xpath, selectedId, showHidden, paginatedNodes, handlePageChange, modelName, handleTextChange, handleSelectItemChange, handleCheckboxToggle, handleAutocompleteChange, handleDateTimeChange]);
    

    const handleFormUpdate = (xpath, dataxpath, value, validationRes = null) => {
        const updatedObj = cloneDeep(updatedData);
        set(updatedObj, dataxpath, value);
        if (onUpdate) {
            onUpdate(updatedObj);
        }
        if (onUserChange) {
            onUserChange(xpath, value, validationRes, null);
        }
    }

    const nodeRenderer = ({
        element,
        isBranch,
        isExpanded,
        getNodeProps,
        level,
        handleExpand
    }) => {
        if (element.id === "root") return null;

        const nodeProps = getNodeProps();
        const originalNode = element.metadata;
        const visualState = itemVisualStates[originalNode.dataxpath]; // Get visual state
        
        // This specific pagination node rendering might not be hit if pagination is solely handled within HeaderField
        if (originalNode && originalNode.isPagination) {
            return (
                <div {...nodeProps} style={{ paddingLeft: `${(level - 1) * 20}px` }}>
                    <div className="pagination-controls">
                        <button 
                            disabled={originalNode.prevPage === 0} 
                            onClick={() => handlePageChange(originalNode.xpath.replace('_pagination', ''), 'prev')}
                        >
                            Previous
                        </button>
                        <span>{originalNode.name}</span>
                        <button 
                            onClick={() => handlePageChange(originalNode.xpath.replace('_pagination', ''), 'next')}
                        >
                            Next
                        </button>
                    </div>
                </div>
            );
        }
        
        const Component = originalNode.children && Array.isArray(originalNode.children) ? HeaderField : Node;

        // Define handleClick within nodeRenderer to have access to handleExpand, element, etc.
        const handleClick = (e) => {
            let actionElement = e.target.closest('[data-add], [data-duplicate], [data-remove], [data-open], [data-close]');
            let isAction = false;
            let isArrowClick = false;
            let actionType = null;
        
            if (actionElement) {
                if (actionElement.hasAttribute('data-add')) { isAction = true; actionType = 'add'; }
                else if (actionElement.hasAttribute('data-duplicate')) { isAction = true; actionType = 'duplicate'; }
                else if (actionElement.hasAttribute('data-remove')) { isAction = true; actionType = 'remove'; }
                else if (actionElement.hasAttribute('data-open') || actionElement.hasAttribute('data-close')) {
                    isArrowClick = true;
                }
            }
        
            // Handle expand/collapse: if it's an arrow click, or a click on the header body (not an action button)
            if (isArrowClick) {
                handleExpand(e); // TreeView's expand handler
            } else if (!isAction && e.currentTarget.contains(e.target) && !actionElement) {
                 // Click on header body, not on a specific action button within it and not an arrow.
                 // Ensure the click target is within the currentTarget (the main div) to avoid issues.
                handleExpand(e); 
            }
            // Note: stopPropagation in HeaderField's options menu buttons is crucial to prevent this handleClick
            // from misinterpreting those clicks as expand/collapse toggles for the main node.

            const attrs = actionElement ? actionElement.attributes : {};
        
            // --- REMOVE --- (child items)
            if (actionType === 'remove' && attrs['data-remove']) {
                const xpathAttr = attrs['data-remove'].value;
                if (!xpathAttr.endsWith(']')) return;
        
                let updatedObj = cloneDeep(updatedData);
                let itemXpath = getDataxpath(updatedObj, xpathAttr);
                if(!itemXpath){
                    
                    return;} //need to disable the remove button if the xpath is not found
                let index = parseInt(itemXpath.substring(itemXpath.lastIndexOf('[') + 1, itemXpath.lastIndexOf(']')));
                let parentXpath = itemXpath.substring(0, itemXpath.lastIndexOf('['));
                let parentObject = get(updatedObj, parentXpath);

                if (parentObject && typeof parentObject.splice === 'function') {
                    parentObject.splice(index, 1);
                    // Clear visual state for the removed item
                    setItemVisualStates(prev => {
                        const newState = { ...prev };
                        delete newState[itemXpath]; // Assuming itemXpath is the dataxpath of the removed item
                        // If there are other related visual states to clean up, do it here.
                        // For instance, if children's visual states were tied to this specific itemXpath
                        Object.keys(newState).forEach(key => {
                            if (key && key.startsWith(itemXpath)) { // Check for null/undefined key
                                delete newState[key];
                            }
                        });
                        return newState;
                    });
                    onUpdate(updatedObj, 'remove');
                }
                return; 
            }
        
            // --- ADD --- (containers)
            if (actionType === 'add' && attrs['data-add']) {
                const xpathAttr = attrs['data-add'].value;
                if (xpathAttr.endsWith(']')) return;
        
                let updatedObj = cloneDeep(updatedData);
                let containerXpath = getDataxpath(updatedObj, xpathAttr);
                let ref = attrs['data-ref'].value;
                let additionalProps = JSON.parse(attrs['data-prop'].value);
                let emptyObject = {};
        
                let parentObject = get(updatedObj, containerXpath);
                if (!parentObject || !Array.isArray(parentObject)) {
                    set(updatedObj, containerXpath, []);
                    parentObject = get(updatedObj, containerXpath);
                }
        
                if ([DATA_TYPES.NUMBER, DATA_TYPES.STRING].includes(ref)) {
                    parentObject.push(null);
                } else {
                    const refParts = ref.split('/');
                    let currentItemSchema = refParts.length === 2 ? projectSchema[refParts[1]] : projectSchema[refParts[1]][refParts[2]];
        
                    if (currentItemSchema.hasOwnProperty('enum') && Object.keys(currentItemSchema).length === 1) {
                        parentObject.push(currentItemSchema.enum[0]);
                    } else {
                        let originalIndex = get(storedData, containerXpath)?.length || 0;
                        let lastItemIndex = -1;
                        if (parentObject.length > 0) {
                            const lastItem = parentObject[parentObject.length - 1];
                            if (lastItem && typeof lastItem === 'object') {
                                const propName = Object.keys(lastItem).find(key => key.startsWith('xpath_'));
                                if (propName && lastItem[propName]) {
                                    const lastItemXpath = lastItem[propName];
                                    lastItemIndex = parseInt(lastItemXpath.substring(lastItemXpath.lastIndexOf('[') + 1, lastItemXpath.lastIndexOf(']')));
                                } else {
                                     lastItemIndex = parentObject.length -1;
                                }
                            } else {
                                 lastItemIndex = parentObject.length -1;
                            }
                        }
                        let nextIndex = Math.max(originalIndex, lastItemIndex + 1);
                        emptyObject = generateObjectFromSchema(projectSchema, cloneDeep(currentItemSchema), additionalProps);
                        emptyObject = addxpath(emptyObject, containerXpath + '[' + nextIndex + ']');
                        // emptyObject._uiState = 'added'; // Removed: visual state managed separately
                        const newDataXpathForAddedItem = containerXpath + '[' + nextIndex + ']';
                        setItemVisualStates(prev => ({ ...prev, [newDataXpathForAddedItem]: 'added' }));
                        parentObject.push(emptyObject);
                    }
                }
                
                setPaginatedNodes(prev => {
                    const currentContainerState = get(updatedObj, containerXpath);
                    const nodeState = prev[containerXpath] || { page: 0, totalPages: 1, totalItems: 0 };
                    const totalItems = currentContainerState.length; 
                    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                    const newItemActualIndex = totalItems - 1; 
                    const targetPage = Math.floor(newItemActualIndex / ITEMS_PER_PAGE);
                    return {
                        ...prev,
                        [containerXpath]: { ...nodeState, page: targetPage, totalPages, totalItems }
                    };
                });
                onUpdate(updatedObj, 'add');
                setTreeState(xpathAttr, true);
                return;
            }
        
            // --- DUPLICATE --- (child items)
            if (actionType === 'duplicate' && attrs['data-duplicate']) {
                const xpathAttr = attrs['data-duplicate'].value;
                if (!xpathAttr.endsWith(']')) return;
        
                let updatedObj = cloneDeep(updatedData);
                let itemXpath = getDataxpath(updatedObj, xpathAttr);
                let ref = attrs['data-ref'].value;
                let additionalProps = JSON.parse(attrs['data-prop'].value);

                let objectToCopy = cloneDeep(get(updatedObj, itemXpath));
                if (!objectToCopy) return;
        
                objectToCopy = clearxpath(objectToCopy);
                clearId(objectToCopy);
        
                let parentXpath = itemXpath.substring(0, itemXpath.lastIndexOf('['));
                let parentObject = get(updatedObj, parentXpath);
                if (!parentObject || !Array.isArray(parentObject)) {
                     set(updatedObj, parentXpath, []);
                     parentObject = get(updatedObj, parentXpath);
                }
        
                let originalIndex = get(storedData, parentXpath)?.length || 0;
                let lastItemIndex = -1;
                if (parentObject.length > 0) {
                    const lastItem = parentObject[parentObject.length - 1];
                     if (lastItem && typeof lastItem === 'object') {
                        const propName = Object.keys(lastItem).find(key => key.startsWith('xpath_'));
                        if (propName && lastItem[propName]) {
                            const lastItemXpath = lastItem[propName];
                            lastItemIndex = parseInt(lastItemXpath.substring(lastItemXpath.lastIndexOf('[') + 1, lastItemXpath.lastIndexOf(']')));
                        } else {
                           lastItemIndex = parentObject.length -1; 
                        }
                    } else {
                        lastItemIndex = parentObject.length -1; 
                    }
                }
                let nextIndex = Math.max(originalIndex, lastItemIndex + 1);

                const refParts = ref.split('/');
                let currentItemSchema = refParts.length === 2 ? projectSchema[refParts[1]] : projectSchema[refParts[1]][refParts[2]];
                let duplicatedObject = generateObjectFromSchema(projectSchema, cloneDeep(currentItemSchema), additionalProps, null, objectToCopy);
                duplicatedObject = addxpath(duplicatedObject, parentXpath + '[' + nextIndex + ']');
                // duplicatedObject._uiState = 'duplicated'; // Removed: visual state managed separately
                const newDataXpathForDuplicatedItem = parentXpath + '[' + nextIndex + ']';
                setItemVisualStates(prev => ({ ...prev, [newDataXpathForDuplicatedItem]: 'duplicated' }));
                parentObject.push(duplicatedObject);
                
                setPaginatedNodes(prev => {
                    const currentContainerState = get(updatedObj, parentXpath);
                    const nodeState = prev[parentXpath] || { page: 0, totalPages: 1, totalItems: 0 };
                    const totalItems = currentContainerState.length; 
                    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                    const newItemActualIndex = nextIndex; 
                    const targetPage = Math.floor(newItemActualIndex / ITEMS_PER_PAGE); 
                    return {
                        ...prev,
                        [parentXpath]: { ...nodeState, page: targetPage, totalPages, totalItems }
                    };
                });
                onUpdate(updatedObj, 'add');
                setTreeState(parentXpath, true);
                return;
            }
        
            // If an arrow was clicked, tree state is already handled by handleExpand.
            // Persist tree state if data-open/data-close attributes were on the arrow element.
            if (isArrowClick) {
                if (attrs['data-open']) {
                    setTreeState(attrs['data-open'].value, true);
                } else if (attrs['data-close']) {
                    setTreeState(attrs['data-close'].value, false);
                }
            }
        }; // End of handleClick

        return (
            <div 
                {...nodeProps} 
                style={{ paddingLeft: `${(level - 1) * 20}px` }}
                onClick={handleClick} 
            >
                <Component 
                    data={{
                        ...originalNode,
                        isOpen: isExpanded
                    }}
                    isOpen={isExpanded}
                    onClick={handleClick}
                    updatedDataForColor={updatedData}
                    storedDataForColor={storedData}
                    visualState={visualState} // Pass visual state as a prop
                />
            </div>
        );
    }; // End of nodeRenderer

     // Calculate defaultExpandedIds in the render scope, based on current state.
     const calculatedDefaultExpandedIds = React.useMemo(() => {
        const ids = ["root"]; // 1. Always expand the synthetic root node (id: "root")
        
        // 2. Also expand the first actual data node (child of "root")
        if (originalTree && originalTree.length > 0) {
            const firstActualNode = originalTree[0];
            if (firstActualNode && firstActualNode.xpath) {
                ids.push(firstActualNode.xpath);
            }
        }
        return Array.from(new Set(ids)); // Ensure unique IDs
    }, [originalTree]);

    return treeData.length > 0 ? (
        <TreeView
            data={treeData}
            aria-label={modelName}
            nodeRenderer={nodeRenderer}
            expandOnKeyboardSelect
            multiSelect={false}
            disableKeyboardNavigation={false}
            defaultExpandedIds={calculatedDefaultExpandedIds}
        />
    ) : null;
};

export default DataTree;
