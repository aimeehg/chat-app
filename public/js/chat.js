const socket = io()
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messagesTemplate = document.querySelector('#messages-template').innerHTML
const urlTemplate = document.querySelector('#url-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild
    //height of the new message
    const newMessagesStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessagesStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //visible height
    const visibleHeight = $messages.offsetHeight
    //height of messages container
    const containerHeight = $messages.scrollHeight
    //how far have i scroll?
    const scrollOffset = $messages.scrollTop + visibleHeight
    
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messagesTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('LocationMessage', (msg) => {
    console.log(msg)
     const html = Mustache.render(urlTemplate, {
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('H:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend', html) 
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', e.target.elements.message.value, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared!')
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href ='/'
    }
})