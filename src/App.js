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
    nowDrawing: false,
    question: "聞きたいことは？"
  }
  
  checkQuestion(content) {
    return !(content.title in this.state.posts)
  }
  

async componentDidMount() {
    try {
      const posts = await API.graphql(graphqlOperation(listPosts))
      let nameList = posts.data.listPosts.items.filter((post) => {
        return this.checkQuestion(post)
      })
      nameList.sort(function(a,b){
        if(a.createdAt > b.createdAt) return -1;
        if(a.createdAt < b.createdAt) return 1;
        return 0;
      });
      console.log('nameList : ', nameList)
      this.setState({ posts: nameList })
    } catch (e) {
      console.log(e)
    }

    API.graphql(graphqlOperation(onCreatePost)).subscribe({
      next: (eventData) => {
        const post = eventData.value.data.onCreatePost
        const posts = [...this.state.posts.filter(content => {
          return this.checkQuestion(content)
        }), post]
        posts.sort(function(a,b){
          if(a.createdAt > b.createdAt) return -1;
          if(a.createdAt < b.createdAt) return 1;
          return 0;
        });
        this.setState({ posts })
      }
    })
  }

  createPost = async () => {

    // バリデーションチェック
    if (this.state.title === '') {
      return
    }

    // 新規登録 mutation
    const createPostInput = {
      title: this.state.title,
    }

    // 登録処理
    try {
      this.setState({ title: ""})
      await API.graphql(graphqlOperation(createPost, { input: createPostInput }))
    } catch (e) {
      console.log(e)
    }
  }

  onChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  // ルーレットを開始
  start = () => {
    let ruoState = setInterval(() => {
      const maxLen = this.state.posts.length
      // 0〜maxLenの範囲でランダムな数値を作成
      var idx = Math.floor( Math.random() * maxLen )
      // ルーレット
      this.setState({ question: this.state.posts[idx].title })
    }, 80);
    this.setState({ nowDrawing: ruoState })
  }
     
  // ルーレットを停止
  stop = () => {
    if(this.state.nowDrawing) {
      clearInterval(this.state.nowDrawing)
    }
    this.setState({ nowDrawing: false })
  }
     
  render() {
    return (
      <div className="App">
        <div className='namelabel'>
          質問
        <input className='nameInput' value={this.state.title} name="title" maxLength={20} onChange={this.onChange}></input>
        <button className='postButton' onClick={this.createPost} disabled={this.state.nowDrawing}>投稿</button>
        </div>
        <div className='mainQuestion'>{this.state.question}
        </div>
        <div>
          <button className='selectButton' onClick={this.start} disabled={this.state.nowDrawing}>スタート</button>
          <button className='selectButton' onClick={this.stop} disabled={!this.state.nowDrawing}>ストップ</button>
        </div>
        <div className='parent-block'>
          <div className='childA-block'>
            {this.state.posts.map((post,idx) => {
              return <div key={idx}><div className='questionTitle'>{post.title}</div></div>})
            }
          </div>
        </div>
      </div>
    )
  }
}

export default App;