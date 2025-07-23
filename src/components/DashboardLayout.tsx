import React from 'react'
import UserList from '../components/UserList'
import ChatRoom from './ChatRoom'
import { useParams } from 'react-router-dom'
import whatsapp from '../asset/whatsapp.jpg'




const DashboardLayout = () => {
    const {otherUserId} = useParams<{otherUserId: string}>()
  return (
    <div className='flex justify-between'>
        <div className={`md:w-[25%] ${otherUserId ? 'hidden': 'block'} w-full md:block md:flex-shrink-0`}>
            <UserList />
        </div>
        <div className={`w-[75%] ${otherUserId? 'block': 'hidden'} flex-1 h-full`}>
            {otherUserId ? 
            <ChatRoom /> : (
                 <div className="flex items-center justify-center h-full text-gray-400 text-xl p-4 text-center"
                 style={{background: `url(${whatsapp})`}}
                 
                 >
                     Select a chat from the left to start messaging!
                 </div>
            )
        }
        </div>

    </div>
  )
}

export default DashboardLayout