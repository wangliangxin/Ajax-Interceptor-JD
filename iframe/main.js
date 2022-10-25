import React, {Component} from 'react';
import 'antd/dist/antd.css';
import {Switch, Collapse, Input, Select, Button, Badge, Tooltip, Form,Radio, Divider,Icon } from 'antd';
const Panel = Collapse.Panel;

import Replacer from './Replacer';

import './Main.less';

const buildUUID = () => {
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
}


export default class Main extends Component {
  constructor() {
    super();
    chrome.runtime.onMessage.addListener(({type, to, url, match}) => {
      if (type === 'ajaxInterceptor' && to === 'iframe') {
        const {interceptedRequests} = this.state;
        if (!interceptedRequests[match]) interceptedRequests[match] = [];

        const exits = interceptedRequests[match].some(obj => {
          if (obj.url === url) {
            obj.num++;
            return true;
          }
          return false;
        });
        
        if (!exits) {
          interceptedRequests[match].push({url, num: 1});
        }
        this.setState({interceptedRequests}, () => {
          if (!exits) {
            // 新增的拦截的url，会多展示一行url，需要重新计算高度
            this.updateAddBtnTop_interval();
          }
        })
      }
    });

    chrome.runtime.sendMessage(chrome.runtime.id, {type: 'ajaxInterceptor', to: 'background', iframeScriptLoaded: true});

    this.collapseWrapperHeight = -1;
  }

  state = {
    interceptedRequests: {},
    showSetting: false, // 默认不显示设置
    modeType: window.setting.ajaxInterceptor_modeType,
    rulesList: []
  }

  componentDidMount() {
    this.updateAddBtnTop_interval();
  }


  updateAddBtnTop = () => {
    let curCollapseWrapperHeight = this.collapseWrapperRef ? this.collapseWrapperRef.offsetHeight : 0;
    if (this.collapseWrapperHeight !== curCollapseWrapperHeight) {
      this.collapseWrapperHeight = curCollapseWrapperHeight;
      clearTimeout(this.updateAddBtnTopDebounceTimeout);
      this.updateAddBtnTopDebounceTimeout = setTimeout(() => {
        this.addBtnRef.style.top = `${curCollapseWrapperHeight + 30}px`;
      }, 50);
    }
  }

  // 计算按钮位置
  updateAddBtnTop_interval = ({timeout = 1000, interval = 50 } = {}) => {
    const i = setInterval(this.updateAddBtnTop, interval);
    setTimeout(() => {
      clearInterval(i);
    }, timeout);
  }

  set = (key, value) => {
    // 发送给background.js
    chrome.runtime.sendMessage(chrome.runtime.id, {type: 'ajaxInterceptor', to: 'background', key, value});
    chrome.storage && chrome.storage.local.set({[key]: value});
  }

  forceUpdateDebouce = () => {
    clearTimeout(this.forceUpdateTimeout);
    this.forceUpdateTimeout = setTimeout(() => {
      this.forceUpdate();
    }, 1000);
  }

  handleSingleSwitchChange = (switchOn, i) => {
    window.setting.ajaxInterceptor_rules[i].switchOn = switchOn;
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

    // 这么搞主要是为了能实时同步window.setting.ajaxInterceptor_rules，并且让性能好一点
    this.forceUpdateDebouce();
  }

  handleFilterTypeChange = (val, i) => {
    window.setting.ajaxInterceptor_rules[i].filterType = val;
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

    this.forceUpdate();
  }

  handleMatchChange = (e, i) => {
    window.setting.ajaxInterceptor_rules[i].match = e.target.value;
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

    this.forceUpdateDebouce();
  }

  handleLabelChange = (e, i) => {
    window.setting.ajaxInterceptor_rules[i].label = e.target.value;
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

    this.forceUpdateDebouce();
  }

  // 添加规则
  handleClickAdd = () => {
    window.setting.ajaxInterceptor_rules.push({match: '', label: `url${window.setting.ajaxInterceptor_rules.length + 1}`, switchOn: true, key: buildUUID()});
    this.forceUpdate(this.updateAddBtnTop_interval);
  }

  handleClickRemove = (e, i) => {
    e.stopPropagation();
    const {interceptedRequests} = this.state;
    const match = window.setting.ajaxInterceptor_rules[i].match;
    const label = window.setting.ajaxInterceptor_rules[i].label;

    window.setting.ajaxInterceptor_rules = [
      ...window.setting.ajaxInterceptor_rules.slice(0, i),
      ...window.setting.ajaxInterceptor_rules.slice(i + 1),
    ];
    this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

    delete interceptedRequests[match];
    delete interceptedRequests[label];
    this.setState({interceptedRequests}, this.updateAddBtnTop_interval);
  }

  handleCollaseChange = ({timeout = 1200, interval = 50 }) => {
    this.updateAddBtnTop_interval();
  }

  handleSwitchChange = () => {
    window.setting.ajaxInterceptor_switchOn = !window.setting.ajaxInterceptor_switchOn;
    this.set('ajaxInterceptor_switchOn', window.setting.ajaxInterceptor_switchOn);

    this.forceUpdate();

    if(!window.setting.ajaxInterceptor_switchOn){
      this.apply()
    }
  }
  // 应用当前配置， 刷新页面
  apply = () => {
    chrome.tabs.reload()
  }

  // 控制设置模块显示与影藏
  toggleShowSet = ()=>{
    this.setState({ showSetting: !this.state.showSetting })
  }

  changeModeType = (e)=>{
    console.log('radio checked', e.target.value);
    chrome.storage && chrome.storage.local.set({['ajaxInterceptor_modeType']: e.target.value});
    this.setState({ modeType: e.target.value })
  }

  handleClearAllRules = ()=>{
    window.setting.ajaxInterceptor_rules = [];
    this.forceUpdate(this.updateAddBtnTop_interval);
  }

  // handleStopAllRules = ()=>{
  //   window.setting.ajaxInterceptor_rules = window.setting.ajaxInterceptor_rules.map((item)=>{
  //     item.switchOn = false;
  //     return { ...item }
  //   })
  //   this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);
    
  //   // 这么搞主要是为了能实时同步window.setting.ajaxInterceptor_rules，并且让性能好一点
  //   this.forceUpdateDebouce();
  // }

  handleCreateFiveRules = ()=>{
    for(let i=0;i< 5;i++){
      this.handleClickAdd()
    }
  }

  render() {
    return (
      <div className="main">
        {/* 头部模块 */}
        <div className="header">
          <Switch
            style={{zIndex: 10}}
            defaultChecked={window.setting.ajaxInterceptor_switchOn}
            onChange={this.handleSwitchChange}
            checkedChildren="开启" 
            unCheckedChildren="关闭"
          />
          <span 
            className="header-title"
            onClick={this.toggleShowSet}
          >ajax-interceptor-jd</span>
          <Button
            type="primary"
            size="small"
            onClick={this.apply}
            disabled={!window.setting.ajaxInterceptor_switchOn}
          >应用<Icon type="forward" /></Button>
        </div>

        {/* 手动添加rule */}
        <div className={window.setting.ajaxInterceptor_switchOn ? 'settingBody' : 'settingBody settingBody-hidden'}>
          {window.setting.ajaxInterceptor_rules && window.setting.ajaxInterceptor_rules.length > 0 ? (
            <div ref={ref => this.collapseWrapperRef = ref}>
              <Collapse
                className={window.setting.ajaxInterceptor_switchOn ? 'collapse' : 'collapse collapse-hidden'}
                onChange={this.handleCollaseChange}
                // onChangeDone={this.handleCollaseChange}
              >
                {window.setting.ajaxInterceptor_rules.map(({filterType = 'normal', match, label, overrideTxt, switchOn = true, key}, i) => (
                  <Panel
                    key={key}
                    header={
                      <div className="panel-header" onClick={e => e.stopPropagation()}>
                        <Input.Group compact style={{width: '78%'}}>
                          {/* 匹配规则名 */}
                          { this.state.modeType === "comb" ? (
                          <Input 
                            placeholder="name"
                            style={{width: '21%'}}
                            defaultValue={label}
                            onChange={e => this.handleLabelChange(e, i)}/>) 
                            : null }
                          {/* 选择模式：普通和正则 */}
                          { this.state.modeType === "comb" ? (
                          <Select defaultValue={filterType} style={{width: '30%'}} onChange={e => this.handleFilterTypeChange(e, i)}>
                            <Option value="normal">normal</Option>
                            <Option value="regex">regex</Option>
                          </Select>) : null }
                          {/* 请求url */}
                          <Input
                            placeholder={filterType === 'normal' ? 'eg: abc/get' : 'eg: abc.*'}
                            style={ this.state.modeType === "comb" ? {width: '49%'} : {width: '100%'}}
                            defaultValue={match}
                            // onClick={e => e.stopPropagation()}
                            onChange={e => this.handleMatchChange(e, i)}
                          />
                        </Input.Group>
                        <Switch
                          size="small"
                          defaultChecked={switchOn}
                          onChange={val => this.handleSingleSwitchChange(val, i)}
                        />
                        <Button
                          style={{marginRight: '16px'}}
                          type="primary"
                          shape="circle" 
                          icon="minus"
                          size="small"
                          onClick={e => this.handleClickRemove(e, i)}
                        />
                      </div>
                    }
                  >
                    <Replacer
                      defaultValue={overrideTxt}
                      updateAddBtnTop={this.updateAddBtnTop}
                      index={i}
                      set={this.set}
                    />
                    {/* <div className="replace-with">
                      Replace With:
                    </div>
                    <textarea
                      className="overrideTxt"
                      // placeholder="replace with"
                      style={{resize: 'none'}}
                      defaultValue={overrideTxt}
                      onChange={e => this.handleOverrideTxtChange(e.target.value, i)}
                    />
                    <Switch onChange={this.handleEditorSwitch} checkedChildren="JSON editor" unCheckedChildren="JSON editor" size="small" />
                    {this.state.showJSONEditor && <div className="JSONEditor">
                      <ReactJson
                        name=""
                        src={JSON.parse(overrideTxt)}
                        onEdit={val => this.handleJSONEditorChange(val, i)}
                        onAdd={val => this.handleJSONEditorChange(val, i)}
                        onDelete={val => this.handleJSONEditorChange(val, i)}
                      />
                    </div>} */}
                    {this.state.interceptedRequests[match] && (
                      <>
                        <div className="intercepted-requests">
                          Intercepted Requests:
                        </div>
                        <div className="intercepted">
                          {this.state.interceptedRequests[match] && this.state.interceptedRequests[match].map(({url, num}) => (
                            <Tooltip placement="top" title={url} key={url}>
                              <Badge
                                count={num}
                                style={{
                                  backgroundColor: '#fff',
                                  color: '#999',
                                  boxShadow: '0 0 0 1px #d9d9d9 inset',
                                  marginTop: '-3px',
                                  marginRight: '4px'
                                }}
                              />
                              <span className="url">{url}</span>
                            </Tooltip>
                          ))}
                        </div>
                      </>
                    )}
                  </Panel>
                ))}
              </Collapse> 
            </div>
          ): <div />}
          <div ref={ref => this.addBtnRef = ref} className="wrapper-btn-add">
            <Button
              className={`btn-add ${window.setting.ajaxInterceptor_switchOn ? '' : ' btn-add-hidden'}`}
              type="primary"
              shape="circle" 
              icon="plus"
              onClick={this.handleClickAdd}
              disabled={!window.setting.ajaxInterceptor_switchOn}
            />
          </div>
        </div>

        {/* 设置模块 */}
        { this.state.showSetting ? (
        <div className={ this.state.showSetting ? "setting" : "setting setting-display"  }>
          <Divider>设置</Divider>
          <div className="setting-item">
            <span className="setting-item-title">模式选择：</span>
            <Radio.Group defaultValue={window.setting.ajaxInterceptor_modeType} onChange={this.changeModeType}>
              <Radio value="simple">简易</Radio>
              <Radio value="comb">组合</Radio>
            </Radio.Group>
          </div>
          <div className="setting-item">
            <span className="setting-item-title">批量操作：</span>
            <Button.Group size="small">
              <Button onClick={this.handleClearAllRules}>clear<Icon type="close-square" /></Button>
              {/* <Button onClick={this.handleStopAllRules}>disable<Icon type="stop" /></Button> */}
              <Button onClick={this.handleCreateFiveRules}>create<Icon type="plus-square" /></Button>
            </Button.Group>
          </div>
        </div>): <div/> }
      </div>
    );
  }
}