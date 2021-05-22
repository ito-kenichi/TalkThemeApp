import React, { Component } from 'react';
import { API, graphqlOperation } from "aws-amplify";
import { listPosts } from './graphql/queries';
import { createPost } from './graphql/mutations';
import { onCreatePost } from './graphql/subscriptions';
import style from './App.css';

class App extends Component {

  state = {
    posts: [],
    title: "",
    isInputName: false,
    isPush: false,
    imgPath: "https://4.bp.blogspot.com/-Oy1zi2vyIXU/Ws2A8zxW_wI/AAAAAAABLOQ/3O9a2ZvHf0E6VlPYx389BeOhmiNb3i2eACLcBGAs/s800/text_gion_shiin.png"
  }

  setImage() {
    if (this.state.posts.length >= 15)
       return "https://thumb.photo-ac.com/a4/a4802d10fa1308cb3cf17d3cd86b4ce6_t.jpeg"
    else if(this.state.posts.length >= 10)
       return "https://thumb.photo-ac.com/5f/5f8e9f4884d70c1316f83e94c9091344_t.jpeg"
    else if(this.state.posts.length >= 5)
       return "https://www.aco.co.jp/_file/facility/65204/01.jpg"
    else if(this.state.posts.length > 1)
       return "https://www.sozailab.jp/db_img/sozai/39971/2ef314d87e7e422f11cfa6162ca3e2bd.jpg"
    else
       return "https://4.bp.blogspot.com/-Oy1zi2vyIXU/Ws2A8zxW_wI/AAAAAAABLOQ/3O9a2ZvHf0E6VlPYx389BeOhmiNb3i2eACLcBGAs/s800/text_gion_shiin.png"
  }
  
  checkKanpai(content) {
    // X秒以内に乾杯
    const diffSeconds = 5
    if(!content['createdAt'] || this.state.title === '') return false
    let targetDate = new Date(content.createdAt.substr(0, 19))
    // 日本時間に合わせる
    targetDate.setHours(targetDate.getHours() + 9)
    let diff = (new Date().getTime() / 1000) - (targetDate.getTime() / 1000)
    return (content.title !== this.state.title && diff < diffSeconds)
  }
  

async componentDidMount() {
    try {
      const posts = await API.graphql(graphqlOperation(listPosts))
      let nameList = posts.data.listPosts.items.filter((post) => {
        return this.checkKanpai(post)
      })
      this.setState({ posts: nameList, imgPath: this.setImage() })
    } catch (e) {
      console.log(e)
    }

    API.graphql(graphqlOperation(onCreatePost)).subscribe({
      next: (eventData) => {
        const post = eventData.value.data.onCreatePost
        let posts = [...this.state.posts.filter(content => {
          return this.checkKanpai(content)
        }), post]
        // subscribの時は直前にmutationした型が異なるため、別途重複削除が必要
        posts = posts.filter((element, index, self) => 
          self.findIndex(e => 
            e.title === element.title
          ) === index)
        console.log('length subs : ', this.state.posts.length)
        this.setState({ posts, imgPath: this.setImage() })
      }
    })
  }

  createPost = async () => {
    this.setState({ isPush: true })
      
    // バリデーションチェック
    if (this.state.title === '') {
      this.setState({isPush: false })
      return
    }

    // 新規登録 mutation
    const createPostInput = {
      title: this.state.title,
    }

    // 登録処理
    try {
      const posts = [...this.state.posts.filter(content => {
        return this.checkKanpai(content)
        }), createPostInput]
      this.setState({ posts: posts, title: this.state.title, imgPath: this.setImage(), isInputName:true, isPush: false })
      await API.graphql(graphqlOperation(createPost, { input: createPostInput }))
      console.log('createPostInput: ', createPostInput)
    } catch (e) {
      console.log(e)
    }
  }

  onChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  render() {
    return (
      <div className="App">
        <div className='namelabel'>
          名前
        <input className='namelabel' value={this.state.title} name="title" maxLength={8} onChange={this.onChange} disabled={this.state.isInputName}></input>
        </div>
        <button className='kanpaiButton' onClick={this.createPost} disabled={this.state.isPush}>カンパ〜い！</button>
        <div className='parent-block'>
          <div className='childB-block'>
            <img
                src={this.state.imgPath}
                className='imgData'
                alt="cute dog"
              />
          </div>
          <div className='childA-block'>
            {this.state.posts.map((post,idx) => {
              return <div key={idx}><div className='kanpaiName'>{post.title}さん</div><img className='kanpaiImg' src='https://1.bp.blogspot.com/-6Z3mOdbZ1kU/UZYlsWNbPDI/AAAAAAAATTk/nWPoBeyEazA/s800/beer_kanpai.png' alt="kanpai-img"/></div>})
            }
          </div>
        </div>
      </div>
    )
  }
}

export default App;