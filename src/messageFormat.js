'use strict'

function messageFormat(messagesDiv, idStr, message, callback) {

  const messageDiv = document.createElement('div')
  messageDiv.style.border = "1px solid grey"
  messageDiv.innerHTML = idStr + ":<br/>" + message 
//  messageDiv.id = 'message-' + idStr
  messagesDiv.append(messageDiv)
//  messageCount++

  window.scrollTo(0,document.body.scrollHeight)


  console.log("messageFormat")
  callback
}

module.exports = messageFormat
