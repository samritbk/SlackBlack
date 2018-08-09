/**
 * The preload script needs to stay in regular ole JavaScript, because it is
 * the point of entry for electron-compile.
 */

if (window.location.href !== 'about:blank') {
  const preloadStartTime = process.hrtime();
  const { ipcRenderer, remote } = require('electron');

  ipcRenderer.on('SLACK_SET_DESKTOP_INTEROP_METADATA', (_event, ...args) =>
    args.forEach(({ key, value }) => window[key] = value)
  );

  const { init } = require('electron-compile');
  const { assignIn } = require('lodash');
  const path = require('path');

  const { isPrebuilt } = require('../utils/process-helpers');
  const profiler = require('../utils/profiler.js');

  if (profiler.shouldProfile()) profiler.startProfiling();

  //tslint:disable-next-line:no-console
  process.on('uncaughtException', (e) => console.error(e));

  /**
   * Patch Node.js globals back in, refer to
   * https://electron.atom.io/docs/api/process/#event-loaded.
   */
  const processRef = window.process;
  process.once('loaded', () => {
    window.process = processRef;
  });

  /**
   * loadSettings are just the command-line arguments we're concerned with, in
   * this case developer vs production mode.
   *
   * Note: we are using one of property in loadSettings to call electron-compile init,
   * so can't get rid of calling remote synchronously here.
   */
  const loadSettings = window.loadSettings = assignIn({},
    remote.getGlobal('loadSettings'),
    { windowType: 'webapp' }
  );

  window.perfTimer = assignIn({}, remote.getGlobal('perfTimer'));
  window.perfTimer.PRELOAD_STARTED = preloadStartTime;

  if (!window.perfTimer.isInitialTeamBooted) {
    ipcRenderer.send('SLACK_PRQ_INITIAL_TEAM_BOOTED');
  }

  const resourcePath = path.join(__dirname, '..', '..');
  const mainModule = require.resolve('../ssb/main.ts');
  const isDevMode = loadSettings.devMode && isPrebuilt();

  init(resourcePath, mainModule, !isDevMode);
}

// First make sure the wrapper app is loaded
document.addEventListener("DOMContentLoaded", function() {

  // Then get its webviews
  let webviews = document.querySelectorAll(".TeamView webview");

  // Fetch our CSS in parallel ahead of time
  const cssPath = 'https://cdn.rawgit.com/widget-/slack-black-theme/master/custom.css';
  let cssPromise = fetch(cssPath).then(response => response.text()).catch(error => alert("Problem"));

  //let cssPromise = require('./myStyle.css').text();
  

  let customCustomCSS = `
  :root {
    /* Modify these to change your theme colors: */
    --primary: #009B91; /*circle around replies, links, etc*/
    --text: #afafaf;
    --background: #141517; /*left bar*/
    --background-elevated: #141517; /*Bar at the top and side */
    --scrollbar-background: #282C34;
    --scrollbar-border: var(--primary);
    --white: #FFF;
  }
  .c-mrkdwn__highlight,
  .c-mrkdwn__mention{ /* Search marks in Cyan */
    border: 1px solid var(--primary) !important;
    border-radius: 2px !important;
    padding:1px 2px !important;
    border-radius: 10px;
    background:transparent !important;
  }
  .c-search__input_and_close{
    background:#222 !important;
  }
  .c-search__input_box,
  .c-search_autocomplete,
  .c-search_autocomplete footer,
  .c-search__input_box__input{
    background:#222 !important;
  }
  span.truncate-left__size,
  c-search_autocomplete__suggestion_icon{
    color:var(--white) !important;
  }
  .client_chat_list_container{
    background: #222 !important;
  }
  #team_menu,
  .p-channel_sidebar{
    background: #222 !important;
  }
  div.c-message.c-message--light.c-message--hover {
    color: #afafaf !important;
    background: #444 !important; /*When hovering over a message */
  }
  div.c-message:hover{
    background: var(--background-hover) !important;
  }
  
  span.c-message__body,
  a.c-message__sender_link,
  span.c-message_attachment__media_trigger
  .c-message_attachment__media_trigger--caption,
  div.p-message_pane__foreword__description span {
    color: #afafaf !important;
  }
  pre.special_formatting{
    background: #111 !important;
    color: var(--text) !important;
    border: 1px solid #CCC !important;
  }
  span.c-message_attachment__text span{
    background:#222 !important;
  }
  .c-message_attachment__border{
    background: var(--text);
  }
  .c-message, .c-virtual_list__item {
    background-color: var(--background) !important; /*primary background*/
  }
  .c-virtual_list__item:hover{
    background-color: #222 !important;
  }
  .c-search_autocomplete__suggestion.c-search_autocomplete__suggestion__highlighted{
    background: var(--primary) !important;
  }
  .ql-editor.ql-blank p,
  .ql-editor.ql-blank span{
    background: #222 !important;
    color: var(--white) !important;
  }
  #msg_input .ql-editor.ql-blank p,
  #inline_message_input_1 .ql-editor.ql-blank p{
    background: var(--background) !important;
    color: var(--white) !important;
  }
  .inline_message_input_container form{
    background: var(--background) !important;
  }
  .c-menu.p-message_actions_menu{
    background: var(--background) !important;
    color:var(--text) !important;
  }
  .menu_item__button--highlighted{
    background-color:var(--primary) !important;
  }
  p-notification_bar__formatting{
    color: var(--text) !important;
  }
  .c-mrkdwn__broadcast,
  .c-mrkdwn__broadcast--link, 
  .c-mrkdwn__broadcast--mention{
    background: transparent !important;
    color: var(--primary) !important;
  }
  .c-deprecated_button ,
  .c-deprecated_button--link, 
  .c-mrkdwn__user_group ,
  .c-mrkdwn__user_group--link, 
  .c-mrkdwn__user_group--mention{
    background: transparent !important;
    color: var(--primary) !important;
  }
  code{  /* code and preformatted*/
    background: #222 !important;
    color: var(--primary) !important;
  }
  
  .c-snippet__code .CodeMirror-code>div:before{  /* preformatted text line number background */
    background:#222 !important;
  }


  .p-channel-sidebar__banner--top{ /* More Unread top banner*/
    background: #2d9ee0 !important;
  }

  .p-channel_sidebar__banner--unreads,
  .msg_inline_attachment_column.column_border{ /* Unread banner top and bottom */
    background: var(--primary) !important;
  }

  .c-message_attachment__text{ /* attachement text */
    color: var(--text);
  }

  .c-message__reply_bar{ /* Open thread bar on message */
    background: #333 !important;
  }
  .c-message__reply_bar:hover{ /* Open thread bar on message: hovered */
    background:#444;
  }
  
  .c-message__reply_bar_view_thread{
    background:transparent !important;
  }
  .c-message_list__day_divider__label__pill, /* Divider per day (Today) */
  .c-message__body blockquote, /* Block quotes */
  .special_formatting_quote,
  .c-scrollbar__child{
    background: #222 !important;
    color: #CCC !important;
  }
  .c-message__body blockquote:before{
    background: var(--primary) !important;
  }

  .c-message__attachments,
  .inline_attachment.standalone{
    background: #222 !important;
    margin-bottom:2px;
  }
  .c-message_attachment__text{
    background: #DDD;
  }
  .c-email__sender_collapsed,
  .c-email__title_collapsed{
    color: #eee;
  }
  .c-message_attachment__pretext,
  .c-message_attachment__author_name,
  .c-message_attachment__field_title{
    color: #eee;
    margin-left: 5px;
  }
  .c-virtual_scrollbar__hider:before{ /* */
    background: #222 !important;
  } 
  .c-file_container{
    background: #222 !important;
  }
  .c-file__title,.c-file__meta{
    color: var(--text) !important;
  }
  .c-file_container--has_thumb .c-file__actions:before{
    background: transparent !important;
  }
  .c-file__action_button, 
  .c-file__action_button:link, 
  .c-file__action_button:visited{
    color:#FCFCFC !important;
    background: #666;
  }
  .p-channel_sidebar__static_list > div:first-of-type{
    height: 45px !important;
  }
  .c-file-_container--gradient:after{
    backgroud:linear-gradient(180deg, hsla(0,0%,100%,0,#666)) !important;
  }
  .c-message_attachment__border,
  .inline_attachment.standalone column_border{
    background: #009B91 !important;
  }
  .c-member_slug--link{
    background: #444;
  }

  ts-message {
    margin: 1px 5px; !important; 
    box-shadow: none !important;
  }
  .c-message_actions__container,
  ts-message .action_hover_container{
    background:#444 !important;
    border: 1px solid #222 !important;
  }
  .c-message_actions__container{
    height: 28px !important;
  }
  .c-message_actions__container:hover,
  ts-message .action_hover_container:hover{ /* Actions container on message */
    background: #222 !important;
    color: var(--primary) !important;
    box-shadow: none !important;
    border-color: rgba(0,0,0,.3) !important;
  }
  .c-message_attachment__field_value{
    color: var(--text);
  }
  .c-scrollbar__hider:before,  /* Top bar */
  .channel_header{
    background-color: #222 !important;
    color: var(--text) !important;
  }
  .c-scrollbar__hider{
    border-botton:1px solid #333;
  }
  .c-reaction{
    background:#222 !important;
    border-color: #222 !important;
  }
  .c-reaction .c-reaction__count{
    color: #aaa !important;
    margin-left: 2px;
  }
  #channel_name{
    color:#EEE !important;
  }
  #channel_header_info,
  #channel_topic_text{
    background: #222 !important;
  }
  #team_menu{
    background:#111 !important;
  }
  #team_menu:hover{
    background:#000 !important;
  }
  .p-channel_sidebar__name:hover{
    color: var(--white) !important;
  }
  #footer{
    background: transparent !important;
    padding-top:8px !important;
    margin-left:1px !important;
  }
  #client_body::before{
    background: #222 !important;
    border: 0px !important;
  }
  .presence_icon{
    color: var(--primary) !important;
  }
  .p-history_container,
  .message_pane_scroller,
  .p-message_pane__top_banners{
    background: #333 !important;
  }
  .unread_msgs_loading,
  .unread_msgs_loading_msg{
    background: #333 !important;
    color: var(--white) !important;
  }
  .ts_icon_all_files:hover,
  .flexpane_menu_item .ts_icon_all_files:hover,
  ts-icon:hover,
  .channel_header_icon:hover ts-icon{
    color: var(--primary) !important;
  }
.c-react_search_input:active .icon_search_wrapper *,
.c-react_search_input:active .search_input_wrapper *,
.c-react_search_input:focus .icon_search_wrapper *,
.c-react_search_input:focus .search_input_wrapper *,
.c-react_search_input:hover .icon_search_wrapper *,
.c-react_search_input:hover .search_input_wrapper *{
  color: var(--primary) !important;
}
.c-icon--presence-online{
  color:var(--primary) !important;
}
.message_input .ql-editor,
.c-message__editor__input .ql-editor{
  background: var(--background) !important;
  color: var(--white);
  margin-right:0px;
}
.message_input,
.c-message__editor__input{
  border-color: var(--primary) !important;
}
.c-button-unstyled.c-message__editor__emoji_menu i{
  color: var(--white);
}
#message_edit_form.btn.btn_small,
.c-button--primary{
  background: var(--primary);
  color: var(--white);
}
.rxn .emoji-sizer {
  background-color: transparent !important;
  border-radius: 7px;
  width: 14px;
  height: 14px;
  margin: 0 0 0 -2px !important;
  border: 1px solid transparent; /* looks silly but it makes the outline work */
}
.rxn[data-emoji] {
  /*background-color: var(--background-light) !important;
  transition: background-color 200ms ease-in;*/
  height: 25px;
}
.message_input.ql-editor{

}
`

  // Insert a style tag into the wrapper view
  cssPromise.then(css => {
    let s = document.createElement('style');
    s.type = 'text/css';
    s.innerHTML = css + customCustomCSS;
    document.head.appendChild(s);
  });

  // Wait for each webview to load
  webviews.forEach(webview => {
    webview.addEventListener('ipc-message', message => {
        if (message.channel == 'didFinishLoading')
          // Finally add the CSS into the webview
          cssPromise.then(css => {
              let script = `
                    let s = document.createElement('style');
                    s.type = 'text/css';
                    s.id = 'slack-custom-css';
                    s.innerHTML = \`${css + customCustomCSS}\`;
                    document.head.appendChild(s);
                    `
              webview.executeJavaScript(script);
          })
    });
  });
});