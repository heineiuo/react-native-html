import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Linking,
  PixelRatio,
} from 'react-native';

import {DefaultHandler, Parser} from './htmlparser';

const ratio = PixelRatio.get();
const InlineTags = ['b','font','i','em','big','strong','small','sub','sup','u','ins','mark','code','address','del','s','strike','a','label','span', 'br'];

const defaultStyle = {
  h1: {
    fontWeight: '500',
    fontSize: 36,
    marginVertical: 5,
  },
  h2: {
    fontWeight: '500',
    fontSize: 30,
    marginVertical: 5,
  },
  h3: {
    fontWeight: '500',
    fontSize: 24,
    marginVertical: 5,
  },
  h4: {
    fontWeight: '500',
    fontSize: 18,
    marginVertical: 5,
  },
  h5: {
    fontWeight: '500',
    fontSize: 14,
    marginVertical: 5,
  },
  h6: {
    fontWeight: '500',
    fontSize: 12,
    marginVertical: 10,
  },
  a: {
    color: '#007aff',
    fontWeight: '500',
  },
  b: {
    fontWeight: 'bold',
  },
  strong: {
    fontWeight: 'bold',
  },
  i: {
    fontStyle: 'italic',
  },
  em: {
    fontStyle: 'italic',
  },
  big: {
    fontSize: 16,
  },
  small: {
    fontSize: 10,
  },
  u: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  ins: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  del: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  s: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  strike: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  mark: {
    backgroundColor: '#fcf8e3',
    borderRadius: 3,
  },
  code: {
    fontFamily: 'Menlo',
    color: '#c9314e',
    backgroundColor: '#faf3f4',
    borderRadius: 3,
  },
  blockquote: {
    borderLeftWidth: 5,
    borderLeftColor: '#eeeeee',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  p: {
    marginVertical: 5,
  },
};

const defaultExternalStyle = {
  p: {
    textIndent: 0,
  }
};

class Html5 extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.parse();
  }

  parse() {
    var handler = new DefaultHandler((err, doms) => {
      if(err) {
        console.log(err);
      } else {
        this.setState({
          doms: doms
        });
      }
    }, {
      ignoreWhitespace: true
    });
    var parser = new Parser(handler);
    parser.parseComplete(this.props.rawHtml.trim());
  }

  unescapeHTML(source) {
    return source
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&copy;/g, '©');
  }

  compile(doms) {
    var styleSheet = this.props.styleSheet || {};
    var externalStyleSheet = this.props.externalStyleSheet || {};
    return doms.map((dom, index) => {
      if(dom.type === 'tag') {
        let style = Object.assign({}, defaultStyle[dom.name], styleSheet[dom.name]);
        let externalStyle = Object.assign({}, defaultExternalStyle[dom.name], externalStyleSheet[dom.name]);
        switch(dom.name) {
          case 'img':
            if(dom.attribs.width) {
              style.width = parseInt(dom.attribs.width);
            }
            if(dom.attribs.height) {
              style.height = parseInt(dom.attribs.height);
            }
            return (
              <XImage
                key={index}
                source={{uri: dom.attribs.src, }}
                style={style}
                resizeMode={Image.resizeMode.strech}
              />
            );
          case 'font':
          case 'i':
          case 'em':
          case 'b':
          case 'strong':
          case 'big':
          case 'small':
          case 'sub':
          case 'sup':
          case 'mark':
          case 'code':
          case 'u':
          case 'ins':
          case 'del':
          case 's':
          case 'strike':
          case 'span':
          case 'time':
          case 'label':
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            return (
              <Text
                key={index}
                style={style}
              >{this.compile(dom.children)}</Text>
            );
          case 'a':
            return (
              <Text
                key={index}
                style={style}
                onPress={() => Linking.openURL(dom.attribs.href)}
              >{this.compile(dom.children)}</Text>
            );
          case 'br':
            return (
              <Text key={index}>{'\n'}</Text>
            );
          default:
            let blockChild = dom.children.find(child => {
              return child.type !== 'text' && !InlineTags.includes(child.name);
            });
            //\u3000
            if(blockChild) {
              return (
                <View
                  key={index}
                  style={style}
                >{this.compile(dom.children)}</View>
              );
            } else {
              if(dom.name === 'p') {
                return (
                  <View
                    key={index}
                    style={style}
                  >
                    <Text>
                      <Text>{' '.repeat(externalStyle.textIndent)}</Text>
                      {this.compile(dom.children)}
                    </Text>
                  </View>
                );
              } else {
                return (
                  <View
                    key={index}
                    style={style}
                  >
                    <Text>
                      {this.compile(dom.children)}
                    </Text>
                  </View>
                );
              }
            }
        }
      } else if(dom.type === 'text') {
        return (
          <Text key={index}>{this.unescapeHTML(dom.data)}</Text>
        );
      } else {
        return (
          <View key={index}>{this.compile(dom.children)}</View>
        );
      }
    });
  }

  render() {
    if(!this.state.doms) {
      return (
        <View></View>
      );
    } else {
      return (
        <View>
          {this.compile(this.state.doms)}
        </View>
      );
    }
  }
}

class XImage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
    };
  }

  componentDidMount() {
    this.fetch();
  }

  fetch() {
    var { style } = this.props;
    if(style.width && style.height) {
      this.setState({
        width: style.width,
        height: style.height,
        loaded: true
      });
    } else {
      Image.getSize(this.props.source.uri, (width, height) => {
        this.setState({
          width: width / ratio,
          height: height / ratio,
          loaded: true
        });
      });
    }
  }

  render() {
    if(!this.state.loaded) {
      return <Text></Text>;
    } else {
      var size = {
        width: this.state.width,
        height: this.state.height,
      };
      Object.assign(this.props.style, size);
      return (
        <Image
          {...this.props}
        />
      );
    }
  }
}

export default Html5