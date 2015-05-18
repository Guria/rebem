import React from 'react';
import isPlainObject from 'lodash.isplainobject';
import buildClassName from './buildClassName';
import isReactClass from './isReactClass';
import convertToReact from './convertToReact';
import mergeWithProps from './mergeWithProps';

/*
    'inherit' from React
*/
const Yummies = Object.create(React);

/*
    .render({ block: 'test' }, document.body, function() {})
*/
Yummies.render = function(json, ...rest) {
    return React.render(convertToReact(json), ...rest);
};

/*
    .renderToString({ block: 'test' })
*/
Yummies.renderToString = function(json) {
    return React.renderToString(convertToReact(json));
};

/*
    .renderToStaticMarkup({ block: 'test' })
*/
Yummies.renderToStaticMarkup = function(json) {
    return React.renderToStaticMarkup(convertToReact(json));
};

/*
    .createElement({ block: 'test' })
    .createElement(class extends Yummies.Component {})
    .createElement('div', { foo: 'bar' }, [ … ])
*/
Yummies.createElement = function(arg, ...rest) {
    if (isPlainObject(arg)) {
        return convertToReact(arg);
    }

    if (isReactClass(arg)) {
        return React.createElement(Yummies._prepareClass(arg), ...rest);
    }

    return React.createElement(arg, ...rest);
};

/*
    .createFactory(class extends Yummies.Component {})
    .createFactory('div')
*/
Yummies.createFactory = function(arg) {
    if (isReactClass(arg)) {
        arg = Yummies._prepareClass(arg);
    }

    return React.createFactory(arg);
};

/*
    Prepare class before the factory.
*/
Yummies._prepareClass = function(Base) {
    return class extends Base {
        constructor(props) {
            super(props);
        }

        render() {
            let result = super.render();

            if (!isPlainObject(result)) {
                return result;
            }

            mergeWithProps(result, this.props);

            return convertToReact(result);
        }
    };
};

/*
    Extends the Base class within `mixins` static property.
*/
Yummies._mixins = function(Base) {
    let Result = Base;

    if (Result.hasOwnProperty('mixins')) {
        Result.mixins.forEach(mixinClassFabric => {
            Result = mixinClassFabric(Result);
        });
    }

    return Result;
};

/*
    Merge collected propTypes.
*/
Yummies._propTypes = function(chain) {
    let out;

    chain.forEach(item => {
        if (item.type === 'propTypes') {
            out = { ...out, ...item.module };
        }
    });

    return out;
};

/*
    Yummify! Collect all the inherited classes chain
    and return a ReactElement Factory.

    Yummies.yummify([
        { type: 'main', module: require('...') },
        { type: 'styles', module: require('...') },
        { type: 'main', module: require('...') }
    ]);
*/
Yummies.yummify = function(chain) {
    let out = Yummies.yummifyRaw(chain)(React.Component);

    out = Yummies._prepareClass(out);

    return React.createFactory(out);
};


/*
    Yummify Raw! Collect all the inherited classes
    chain and return a resulted class factory.
*/
Yummies.yummifyRaw = function(chain) {
    return function(Base) {
        let out = Base;

        chain.forEach(item => {
            if (item.type === 'main') {
                out = Yummies._mixins(item.module(out));
            }
        });

        const propTypes = Yummies._propTypes(chain);

        if (propTypes) {
            out.propTypes = propTypes;
        }

        return out;
    };
};

/*
    Helper to build a className string from BEMJSON-object.
*/
Yummies.buildClassName = buildClassName;

export default Yummies;
